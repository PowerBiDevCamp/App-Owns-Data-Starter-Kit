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

    public PowerBiServiceApi(IConfiguration configuration, ITokenAcquisition tokenAcquisition, AppOwnsDataDBService AppOwnsDataDBService, IWebHostEnvironment env) {
      this.Configuration = configuration;
      this.urlPowerBiServiceApiRoot = configuration["PowerBi:ServiceRootUrl"];
      this.tokenAcquisition = tokenAcquisition;
      this.AppOwnsDataDBService = AppOwnsDataDBService;
      this.Env = env;
    }

    public const string powerbiApiDefaultScope = "https://analysis.windows.net/powerbi/api/.default";

    public string GetAccessToken() {
      return this.tokenAcquisition.GetAccessTokenForAppAsync(powerbiApiDefaultScope).Result;
    }

    public PowerBIClient GetPowerBiClient() {
      var tokenCredentials = new TokenCredentials(GetAccessToken(), "Bearer");
      return new PowerBIClient(new Uri(urlPowerBiServiceApiRoot), tokenCredentials);
    }

    public async Task<EmbeddedReportViewModel> GetReport(Guid WorkspaceId, Guid ReportId) {

      PowerBIClient pbiClient = GetPowerBiClient();

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

    public Dataset GetDataset(PowerBIClient pbiClient, Guid WorkspaceId, string DatasetName) {
      var datasets = pbiClient.Datasets.GetDatasetsInGroup(WorkspaceId).Value;
      foreach (var dataset in datasets) {
        if (dataset.Name.Equals(DatasetName)) {
          return dataset;
        }
      }
      return null;
    }

    public async Task<IList<Group>> GetTenantWorkspaces(PowerBIClient pbiClient) {
      var workspaces = (await pbiClient.Groups.GetGroupsAsync()).Value;
      return workspaces;
    }

    public PowerBiTenant OnboardNewTenant(PowerBiTenant tenant) {

      PowerBIClient pbiClient = this.GetPowerBiClient();

      // create new app workspace
      GroupCreationRequest request = new GroupCreationRequest(tenant.Name);
      Group workspace = pbiClient.Groups.CreateGroup(request);

      tenant.WorkspaceId = workspace.Id.ToString();
      tenant.WorkspaceUrl = "https://app.powerbi.com/groups/" + workspace.Id.ToString() + "/";

      // add user as new workspace admin to make demoing easier
      string adminUser = Configuration["DemoSettings:AdminUser"];
      if (!string.IsNullOrEmpty(adminUser)) {
        pbiClient.Groups.AddGroupUser(workspace.Id, new GroupUser {
          EmailAddress = adminUser,
          GroupUserAccessRight = "Admin"
        });
      }

      // upload sample PBIX file #1
      string pbixPath = this.Env.WebRootPath + @"/PBIX/SalesReportTemplate.pbix";
      string importName = "Sales";
      PublishPBIX(pbiClient, workspace.Id, pbixPath, importName);

      Dataset dataset = GetDataset(pbiClient, workspace.Id, importName);

      UpdateMashupParametersRequest req =
        new UpdateMashupParametersRequest(new List<UpdateMashupParameterDetails>() {
          new UpdateMashupParameterDetails { Name = "DatabaseServer", NewValue = tenant.DatabaseServer },
          new UpdateMashupParameterDetails { Name = "DatabaseName", NewValue = tenant.DatabaseName }
      });

      pbiClient.Datasets.UpdateParametersInGroup(workspace.Id, dataset.Id, req);

      PatchSqlDatasourceCredentials(pbiClient, workspace.Id, dataset.Id, tenant.DatabaseUserName, tenant.DatabaseUserPassword);

      pbiClient.Datasets.RefreshDatasetInGroup(workspace.Id, dataset.Id);

      return tenant;
    }

    public PowerBiTenantDetails GetTenantDetails(PowerBiTenant tenant) {

      PowerBIClient pbiClient = this.GetPowerBiClient();

      return new PowerBiTenantDetails {
        Name = tenant.Name,
        DatabaseName = tenant.DatabaseName,
        DatabaseServer = tenant.DatabaseServer,
        DatabaseUserName = tenant.DatabaseUserName,
        DatabaseUserPassword = tenant.DatabaseUserPassword,
        WorkspaceId = tenant.WorkspaceId,
        WorkspaceUrl = tenant.WorkspaceUrl,
        Members = pbiClient.Groups.GetGroupUsers(new Guid(tenant.WorkspaceId)).Value,
        Datasets = pbiClient.Datasets.GetDatasetsInGroup(new Guid(tenant.WorkspaceId)).Value,
        Reports = pbiClient.Reports.GetReportsInGroup(new Guid(tenant.WorkspaceId)).Value
      };

    }

    public PowerBiTenant CreateAppWorkspace(PowerBIClient pbiClient, PowerBiTenant tenant) {

      // create new app workspace
      GroupCreationRequest request = new GroupCreationRequest(tenant.Name);
      Group workspace = pbiClient.Groups.CreateGroup(request);

      // add user as new workspace admin to make demoing easier
      string adminUser = Configuration["DemoSettings:AdminUser"];
      if (!string.IsNullOrEmpty(adminUser)) {
        pbiClient.Groups.AddGroupUser(workspace.Id, new GroupUser {
          EmailAddress = adminUser,
          GroupUserAccessRight = "Admin"
        });
      }

      tenant.WorkspaceId = workspace.Id.ToString();

      return tenant;
    }

    public void DeleteWorkspace(PowerBiTenant tenant) {
      PowerBIClient pbiClient = this.GetPowerBiClient();
      Guid workspaceIdGuid = new Guid(tenant.WorkspaceId);
      pbiClient.Groups.DeleteGroup(workspaceIdGuid);
    }

    public void PublishPBIX(PowerBIClient pbiClient, Guid WorkspaceId, string PbixFilePath, string ImportName) {

      FileStream stream = new FileStream(PbixFilePath, FileMode.Open, FileAccess.Read);

      var import = pbiClient.Imports.PostImportWithFileInGroup(WorkspaceId, stream, ImportName);

      while (import.ImportState != "Succeeded") {
        import = pbiClient.Imports.GetImportInGroup(WorkspaceId, import.Id);
      }

    }

    public void PatchSqlDatasourceCredentials(PowerBIClient pbiClient, Guid WorkspaceId, string DatasetId, string SqlUserName, string SqlUserPassword) {

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

    public async Task<EmbeddedReportViewModel> GetReportEmbeddingData(string AppIdentity, string Tenant) {

      PowerBIClient pbiClient = GetPowerBiClient();

      var tenant = this.AppOwnsDataDBService.GetTenant(Tenant);
      Guid workspaceId = new Guid(tenant.WorkspaceId);
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
        TenantName = Tenant
      };

    }


  }

}