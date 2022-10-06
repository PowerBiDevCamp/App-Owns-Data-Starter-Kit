using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using Newtonsoft.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.PowerBI.Api;
using Microsoft.PowerBI.Api.Models;
using Microsoft.PowerBI.Api.Models.Credentials;
using Microsoft.Rest;
using AppOwnsDataShared.Models;
using Microsoft.Identity.Web;
using AppOwnsDataShared.Services;
using System.Text;

namespace AppOwnsDataAdmin.Services {

  public class EmbeddedReportViewModel {
    public string ReportId;
    public string Name;
    public string EmbedUrl;
    public string Token;
    public string TenantName;
  }

  public class PowerBiTenantDetails : PowerBiTenant {
    public IList<Report> Reports { get; set; }
    public IList<Dataset> Datasets { get; set; }
    public IList<GroupUser> Members { get; set; }
  }

  public class PowerBiServiceApi {

    private readonly AppOwnsDataDBService AppOwnsDataDBService;
    private readonly IConfiguration Configuration;
    private readonly IWebHostEnvironment Env;

    private ITokenAcquisition tokenAcquisition { get; }
    private string urlPowerBiServiceApiRoot { get; }
    private string targetCapacityId { get; }
    private PowerBIClient pbiClient { get; set; }

    public PowerBiServiceApi(IConfiguration configuration, ITokenAcquisition tokenAcquisition, AppOwnsDataDBService AppOwnsDataDBService, IWebHostEnvironment env) {
      this.Configuration = configuration;
      this.urlPowerBiServiceApiRoot = configuration["PowerBi:ServiceRootUrl"];
      this.targetCapacityId = configuration["PowerBi:TargetCapacityId"];
      this.tokenAcquisition = tokenAcquisition;
      this.AppOwnsDataDBService = AppOwnsDataDBService;
      this.Env = env;
      pbiClient = GetPowerBiClient();
    }

    public const string powerbiApiDefaultScope = "https://analysis.windows.net/powerbi/api/.default";

    public string GetAccessToken() {
      return this.tokenAcquisition.GetAccessTokenForAppAsync(powerbiApiDefaultScope).Result;
    }

    public PowerBIClient GetPowerBiClient() {
      var tokenCredentials = new TokenCredentials(GetAccessToken(), "Bearer");
      return new PowerBIClient(new Uri(urlPowerBiServiceApiRoot), tokenCredentials);
    }

    private PowerBIClient GetPowerBiClientForProfile(Guid ProfileId) {
      var tokenCredentials = new TokenCredentials(GetAccessToken(), "Bearer");
      return new PowerBIClient(new Uri(urlPowerBiServiceApiRoot), tokenCredentials, ProfileId);
    }

    private void SetCallingContext(string ProfileId = "") {
      if (ProfileId.Equals("")) {
        pbiClient = GetPowerBiClient();
      }
      else {
        pbiClient = GetPowerBiClientForProfile(new Guid(ProfileId));
      }
    }

    public async Task<EmbeddedReportViewModel> GetReport(Guid WorkspaceId, Guid ReportId) {

      // call to Power BI Service API to get embedding data
      var report = await pbiClient.Reports.GetReportInGroupAsync(WorkspaceId, ReportId);

      // generate read-only embed token for the report
      var datasetId = report.DatasetId;
      var tokenRequest = new GenerateTokenRequest(TokenAccessLevel.View, datasetId);
      var embedTokenResponse = await pbiClient.Reports.GenerateTokenAsync(WorkspaceId, ReportId, tokenRequest);
      var embedToken = embedTokenResponse.Token;

      // return report embedding data to caller
      return new EmbeddedReportViewModel {
        ReportId = report.Id.ToString(),
        EmbedUrl = report.EmbedUrl,
        Name = report.Name,
        Token = embedToken
      };
    }

    public Dataset GetDataset(Guid WorkspaceId, string DatasetName) {
      var datasets = pbiClient.Datasets.GetDatasetsInGroup(WorkspaceId).Value;
      foreach (var dataset in datasets) {
        if (dataset.Name.Equals(DatasetName)) {
          return dataset;
        }
      }
      return null;
    }

    public async Task<IList<Group>> GetTenantWorkspaces() {
      var workspaces = (await pbiClient.Groups.GetGroupsAsync()).Value;
      return workspaces;
    }

    public PowerBiTenant OnboardNewTenant(PowerBiTenant tenant) {

      this.SetCallingContext();

      var createRequest = new CreateOrUpdateProfileRequest(tenant.Name + " Profile");
      var profile = pbiClient.Profiles.CreateProfile(createRequest);

      string profileId = profile.Id.ToString();
      tenant.ProfileId = profileId;

      SetCallingContext(profileId);

      // create new app workspace
      GroupCreationRequest request = new GroupCreationRequest("AODSK: " + tenant.Name);
      Group workspace = pbiClient.Groups.CreateGroup(request);

      // assign new workspace to dedicated capacity 
      if (targetCapacityId != "") {
        pbiClient.Groups.AssignToCapacity(workspace.Id, new AssignToCapacityRequest {
          CapacityId = new Guid(targetCapacityId),
        });
      }

      tenant.WorkspaceId = workspace.Id.ToString();
      tenant.WorkspaceUrl = "https://app.powerbi.com/groups/" + workspace.Id.ToString() + "/";

      // This code adds service principal as workspace Contributor member
      // -- Adding service principal as member is required due to security bug when 
      // -- creating embed token for paginated report using service princpal profiles 
      var userServicePrincipal = pbiClient.Groups.GetGroupUsers(workspace.Id).Value[0];
      string servicePrincipalObjectId = userServicePrincipal.Identifier;
      pbiClient.Groups.AddGroupUser(workspace.Id, new GroupUser {
        Identifier = servicePrincipalObjectId,
        PrincipalType = PrincipalType.App,
        GroupUserAccessRight = "Contributor"
      });


      // add user as new workspace admin to make demoing easier
      string adminUser = Configuration["DemoSettings:AdminUser"];
      if (!string.IsNullOrEmpty(adminUser)) {
        pbiClient.Groups.AddGroupUser(workspace.Id, new GroupUser {
          Identifier = adminUser,
          PrincipalType = PrincipalType.User,
          EmailAddress = adminUser,
          GroupUserAccessRight = "Admin"
        });
      }

      // upload sample PBIX file #1
      string importName = "Sales";
      PublishPBIX(workspace.Id, importName);

      Dataset dataset = GetDataset(workspace.Id, importName);

      UpdateMashupParametersRequest req =
        new UpdateMashupParametersRequest(new List<UpdateMashupParameterDetails>() {
          new UpdateMashupParameterDetails { Name = "DatabaseServer", NewValue = tenant.DatabaseServer },
          new UpdateMashupParameterDetails { Name = "DatabaseName", NewValue = tenant.DatabaseName }
      });

      pbiClient.Datasets.UpdateParametersInGroup(workspace.Id, dataset.Id, req);

      PatchSqlDatasourceCredentials(workspace.Id, dataset.Id, tenant.DatabaseUserName, tenant.DatabaseUserPassword);

      pbiClient.Datasets.RefreshDatasetInGroup(workspace.Id, dataset.Id);

      if (targetCapacityId != "") {
        // only import paginated report if workspace has been associated with dedicated capacity
        string PaginatedReportName = "Sales Summary";
        PublishRDL(workspace, PaginatedReportName, dataset);
      }

      return tenant;
    }

    public PowerBiTenantDetails GetTenantDetails(PowerBiTenant tenant) {

      SetCallingContext(tenant.ProfileId);

      return new PowerBiTenantDetails {
        Name = tenant.Name,
        DatabaseName = tenant.DatabaseName,
        DatabaseServer = tenant.DatabaseServer,
        DatabaseUserName = tenant.DatabaseUserName,
        DatabaseUserPassword = tenant.DatabaseUserPassword,
        ProfileId = tenant.ProfileId,
        Created = tenant.Created,
        WorkspaceId = tenant.WorkspaceId,
        WorkspaceUrl = tenant.WorkspaceUrl,
        Members = pbiClient.Groups.GetGroupUsers(new Guid(tenant.WorkspaceId)).Value,
        Datasets = pbiClient.Datasets.GetDatasetsInGroup(new Guid(tenant.WorkspaceId)).Value,
        Reports = pbiClient.Reports.GetReportsInGroup(new Guid(tenant.WorkspaceId)).Value
      };

    }

    public void DeleteTenant(PowerBiTenant tenant) {

      // delete workspace as service principal profile
      SetCallingContext(tenant.ProfileId);
      Guid workspaceIdGuid = new Guid(tenant.WorkspaceId);
      pbiClient.Groups.DeleteGroup(workspaceIdGuid);

      // swtch back to service principal to delete service principal profile
      SetCallingContext();
      pbiClient.Profiles.DeleteProfile(new Guid(tenant.ProfileId));

    }

    public void PublishPBIX(Guid WorkspaceId, string ImportName) {

      string PbixFilePath = this.Env.WebRootPath + @"/PBIX/SalesReportTemplate.pbix";

      FileStream stream = new FileStream(PbixFilePath, FileMode.Open, FileAccess.Read);

      var import = pbiClient.Imports.PostImportWithFileInGroup(WorkspaceId, stream, ImportName);

      while (import.ImportState != "Succeeded") {
        import = pbiClient.Imports.GetImportInGroup(WorkspaceId, import.Id);
      }

    }

    public void PatchSqlDatasourceCredentials(Guid WorkspaceId, string DatasetId, string SqlUserName, string SqlUserPassword) {

      var datasources = (pbiClient.Datasets.GetDatasourcesInGroup(WorkspaceId, DatasetId)).Value;

      // find the target SQL datasource
      foreach (var datasource in datasources) {
        if (datasource.DatasourceType.ToLower() == "sql") {
          // get the datasourceId and the gatewayId
          var datasourceId = datasource.DatasourceId;
          var gatewayId = datasource.GatewayId;
          // Create UpdateDatasourceRequest to update Azure SQL datasource credentials
          UpdateDatasourceRequest req = new UpdateDatasourceRequest {
            CredentialDetails = new CredentialDetails(
              new BasicCredentials(SqlUserName, SqlUserPassword),
              PrivacyLevel.None,
              EncryptedConnection.NotEncrypted)
          };
          // Execute Patch command to update Azure SQL datasource credentials
          pbiClient.Gateways.UpdateDatasource((Guid)gatewayId, (Guid)datasourceId, req);
        }
      };

    }

    public void PublishRDL(Group Workspace, string ImportName, Dataset TargetDataset) {

      string rdlFilePath = this.Env.WebRootPath + @"/PBIX/SalesSummaryPaginated.rdl";

      FileStream stream = new FileStream(rdlFilePath, FileMode.Open, FileAccess.Read);
      StreamReader reader = new StreamReader(stream);
      string rdlFileContent = reader.ReadToEnd();
      reader.Close();
      stream.Close();

      rdlFileContent = rdlFileContent.Replace("{{TargetDatasetId}}", TargetDataset.Id.ToString())
                                     .Replace("{{PowerBIWorkspaceName}}", Workspace.Name)
                                     .Replace("{{PowerBIDatasetName}}", TargetDataset.Name);

      MemoryStream contentSteam = new MemoryStream(Encoding.ASCII.GetBytes(rdlFileContent));

      string rdlImportName = ImportName + ".rdl";

      var import = pbiClient.Imports.PostImportWithFileInGroup(Workspace.Id, contentSteam, rdlImportName, ImportConflictHandlerMode.Abort);

      // poll to determine when import operation has complete
      do { import = pbiClient.Imports.GetImportInGroup(Workspace.Id, import.Id); }
      while (import.ImportState.Equals("Publishing"));

      Guid reportId = import.Reports[0].Id;

    }

    public async Task<EmbeddedReportViewModel> GetReportEmbeddingData(PowerBiTenant Tenant) {

      SetCallingContext(Tenant.ProfileId);

      Guid workspaceId = new Guid(Tenant.WorkspaceId);
      var reports = (await pbiClient.Reports.GetReportsInGroupAsync(workspaceId)).Value;

      var report = reports.Where(report => report.Name.Equals("Sales")).First();

      GenerateTokenRequest generateTokenRequestParameters = new GenerateTokenRequest(accessLevel: "View");

      // call to Power BI Service API and pass GenerateTokenRequest object to generate embed token
      string embedToken = pbiClient.Reports.GenerateTokenInGroup(workspaceId, report.Id,
                                                                 generateTokenRequestParameters).Token;

      return new EmbeddedReportViewModel {
        ReportId = report.Id.ToString(),
        Name = report.Name,
        EmbedUrl = report.EmbedUrl,
        Token = embedToken,
        TenantName = Tenant.Name
      };

    }

  }

}