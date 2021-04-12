using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Identity.Web;
using Microsoft.Rest;
using Microsoft.PowerBI.Api;
using Microsoft.PowerBI.Api.Models;
using AppOwnsDataShared.Models;
using AppOwnsDataWebApi.Models;
using AppOwnsDataShared.Services;

namespace AppOwnsDataWebApi.Services {

  public class PowerBiServiceApi {

    private ITokenAcquisition tokenAcquisition { get; }
    private string urlPowerBiServiceApiRoot { get; }
    private readonly AppOwnsDataDBService appOwnsDataDBService;

    public PowerBiServiceApi(IConfiguration configuration, ITokenAcquisition tokenAcquisition, AppOwnsDataDBService appOwnsDataDBService) {
      this.urlPowerBiServiceApiRoot = configuration["PowerBi:ServiceRootUrl"];
      this.tokenAcquisition = tokenAcquisition;
      this.appOwnsDataDBService = appOwnsDataDBService;
    }

    public const string powerbiApiDefaultScope = "https://analysis.windows.net/powerbi/api/.default";

    public string GetAccessToken() {
      return this.tokenAcquisition.GetAccessTokenForAppAsync(powerbiApiDefaultScope).Result;
    }

    public PowerBIClient GetPowerBiClient() {
      var tokenCredentials = new TokenCredentials(GetAccessToken(), "Bearer");
      return new PowerBIClient(new Uri(urlPowerBiServiceApiRoot), tokenCredentials);
    }

    //public async Task<EmbeddedReport> GetReport(Guid WorkspaceId, Guid ReportId) {

    //  PowerBIClient pbiClient = GetPowerBiClient();

    //  // call to Power BI Service API to get embedding data
    //  var report = await pbiClient.Reports.GetReportInGroupAsync(WorkspaceId, ReportId);

    //  // generate read-only embed token for the report
    //  var datasetId = report.DatasetId;
    //  var tokenRequest = new GenerateTokenRequest(TokenAccessLevel.View, datasetId);
    //  var embedTokenResponse = await pbiClient.Reports.GenerateTokenAsync(WorkspaceId, ReportId, tokenRequest);
    //  var embedToken = embedTokenResponse.Token;

    //  // return report embedding data to caller
    //  return new EmbeddedReport {
    //    id = report.Id.ToString(),
    //    embedUrl = report.EmbedUrl,
    //    name = report.Name
    //  };
    //}

    public async Task<EmbeddedViewModel> GetEmbeddedViewModel(string user) {

      User currentUser = this.appOwnsDataDBService.GetUser(user);

      if (currentUser.TenantName == null || currentUser.TenantName == "") {
        return new EmbeddedViewModel { tenantName = "" };
      }

      PowerBiTenant currentTenant = appOwnsDataDBService.GetTenant(currentUser.TenantName);

      Guid workspaceId = new Guid(currentTenant.WorkspaceId);

      PowerBIClient pbiClient = GetPowerBiClient();

      var datasets = (await pbiClient.Datasets.GetDatasetsInGroupAsync(workspaceId)).Value;
      var reports = (await pbiClient.Reports.GetReportsInGroupAsync(workspaceId)).Value;

      IList<GenerateTokenRequestV2Dataset> datasetRequests = new List<GenerateTokenRequestV2Dataset>();
      IList<string> datasetIds = new List<string>();

      foreach (var dataset in datasets) {
        datasetRequests.Add(new GenerateTokenRequestV2Dataset(dataset.Id));
        datasetIds.Add(dataset.Id);
      };

      IList<GenerateTokenRequestV2Report> reportRequests = new List<GenerateTokenRequestV2Report>();
      foreach (var report in reports) {
        reportRequests.Add(new GenerateTokenRequestV2Report(report.Id, allowEdit: currentUser.CanEdit));
      };

      var workspaceRequests = new List<GenerateTokenRequestV2TargetWorkspace>();
      if (currentUser.CanCreate) {
        workspaceRequests.Add(new GenerateTokenRequestV2TargetWorkspace(workspaceId));
      }

      GenerateTokenRequestV2 tokenRequest =
        new GenerateTokenRequestV2 { 
          Datasets = datasetRequests,
          Reports =  reportRequests,
          TargetWorkspaces = workspaceRequests
       };

      // call to Power BI Service API and pass GenerateTokenRequest object to generate embed token
      var EmbedTokenResult = pbiClient.EmbedToken.GenerateToken(tokenRequest);
      
      return new EmbeddedViewModel {
        tenantName = currentUser.TenantName,
        reports = reports,
        datasets = datasets,
        embedToken = EmbedTokenResult.Token,
        embedTokenId = EmbedTokenResult.TokenId.ToString(),
        user = currentUser.LoginId,
        userCanEdit = currentUser.CanEdit,
        userCanCreate = currentUser.CanCreate
      };     
      
    }

    public async Task<string> GetEmbedToken(string user) {

      User currentUser = this.appOwnsDataDBService.GetUser(user);

      if (currentUser.TenantName == null || currentUser.TenantName == "") {
        throw new ApplicationException("User not assigned to tenant");
      }

      PowerBiTenant currentTenant = appOwnsDataDBService.GetTenant(currentUser.TenantName);

      Guid workspaceId = new Guid(currentTenant.WorkspaceId);

      PowerBIClient pbiClient = GetPowerBiClient();

      var reports = (await pbiClient.Reports.GetReportsInGroupAsync(workspaceId)).Value;
      var datasets = (await pbiClient.Datasets.GetDatasetsInGroupAsync(workspaceId)).Value;

      IList<GenerateTokenRequestV2Dataset> datasetRequests = new List<GenerateTokenRequestV2Dataset>();
      foreach (var dataset in datasets) {
        datasetRequests.Add(new GenerateTokenRequestV2Dataset(dataset.Id));
      };

      IList<GenerateTokenRequestV2Report> reportRequests = new List<GenerateTokenRequestV2Report>();
      foreach (var report in reports) {
        reportRequests.Add(new GenerateTokenRequestV2Report(report.Id, allowEdit: currentUser.CanEdit));
      };

      var workspaceRequests = new List<GenerateTokenRequestV2TargetWorkspace>();
      if (currentUser.CanCreate) {
        workspaceRequests.Add(new GenerateTokenRequestV2TargetWorkspace(workspaceId));
      }

      GenerateTokenRequestV2 tokenRequest =
        new GenerateTokenRequestV2 {
          Datasets = datasetRequests,
          Reports = reportRequests,
          TargetWorkspaces = workspaceRequests
        };

      // call to Power BI Service API and pass GenerateTokenRequest object to generate embed token
      return pbiClient.EmbedToken.GenerateToken(tokenRequest).Token;

    }

  }
}
