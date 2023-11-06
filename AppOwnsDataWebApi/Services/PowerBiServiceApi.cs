using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Identity.Web;
using Microsoft.Rest;
using Microsoft.PowerBI.Api;
using Microsoft.PowerBI.Api.Models;
using AppOwnsDataModels = AppOwnsDataShared.Models;
using AppOwnsDataWebApi.Models;
using AppOwnsDataShared.Services;

namespace AppOwnsDataWebApi.Services {

  public class PowerBiServiceApi {

    private TokenManager tokenManager { get; }
    private string urlPowerBiServiceApiRoot { get; }
    private readonly AppOwnsDataDBService appOwnsDataDBService;

    private int embedTokenLifetime { get; set; }
    private string accessToken { get; set; }
    private PowerBIClient pbiClient { get; set; }

    public PowerBiServiceApi(IConfiguration configuration, TokenManager tokenManager, AppOwnsDataDBService appOwnsDataDBService) {
      this.urlPowerBiServiceApiRoot = configuration["PowerBi:ServiceRootUrl"];
      this.embedTokenLifetime = int.Parse(configuration["PowerBi:EmbedTokenLifetime"]);
      this.tokenManager = tokenManager;
      this.appOwnsDataDBService = appOwnsDataDBService;
      this.accessToken = this.tokenManager.getAccessToken();
      this.pbiClient = GetPowerBiClient();
    }

    public PowerBIClient GetPowerBiClient() {
      var tokenCredentials = new TokenCredentials(this.accessToken, "Bearer");
      return new PowerBIClient(new Uri(urlPowerBiServiceApiRoot), tokenCredentials);
    }

    private PowerBIClient GetPowerBiClientForProfile(Guid ProfileId) {
      var tokenCredentials = new TokenCredentials(this.accessToken, "Bearer");
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

    public async Task<EmbeddedViewModel> GetEmbeddedViewModel(string user) {

      AppOwnsDataModels.User currentUser = this.appOwnsDataDBService.GetUser(user);

      if (currentUser.TenantName == null || currentUser.TenantName == "") {
        return new EmbeddedViewModel { tenantName = "" };
      }

      AppOwnsDataModels.PowerBiTenant currentTenant = appOwnsDataDBService.GetTenant(currentUser.TenantName);

      SetCallingContext(currentTenant.ProfileId);

      Guid workspaceId = new Guid(currentTenant.WorkspaceId);

      var datasets = (await pbiClient.Datasets.GetDatasetsInGroupAsync(workspaceId)).Value;
      var embeddedDatasets = new List<EmbeddedDataset>();
      foreach (var dataset in datasets) {
        embeddedDatasets.Add(new EmbeddedDataset {
          id = dataset.Id,
          name = dataset.Name,
          createReportEmbedURL = dataset.CreateReportEmbedURL
        });
      }

      var reports = (await pbiClient.Reports.GetReportsInGroupAsync(workspaceId)).Value;
      var embeddedReports = new List<EmbeddedReport>();
      foreach (var report in reports) {
        embeddedReports.Add(new EmbeddedReport {
          id = report.Id.ToString(),
          name = report.Name,
          embedUrl = report.EmbedUrl,
          datasetId = report.DatasetId,
          reportType = report.ReportType
        });
      }

      IList<GenerateTokenRequestV2Dataset> datasetRequests = new List<GenerateTokenRequestV2Dataset>();
      IList<string> datasetIds = new List<string>();

      foreach (var dataset in datasets) {
        datasetRequests.Add(new GenerateTokenRequestV2Dataset(dataset.Id, xmlaPermissions: XmlaPermissions.ReadOnly));
        datasetIds.Add(dataset.Id);
      };

      IList<GenerateTokenRequestV2Report> reportRequests = new List<GenerateTokenRequestV2Report>();
      foreach (var report in reports) {
        Boolean userCanEdit = currentUser.CanEdit && report.ReportType.Equals("PowerBIReport");
        reportRequests.Add(new GenerateTokenRequestV2Report(report.Id, allowEdit: userCanEdit));
      };

      var workspaceRequests = new List<GenerateTokenRequestV2TargetWorkspace>();
      if (currentUser.CanCreate) {
        workspaceRequests.Add(new GenerateTokenRequestV2TargetWorkspace(workspaceId));
      }

      GenerateTokenRequestV2 tokenRequest =
        new GenerateTokenRequestV2 {
          Datasets = datasetRequests,
          Reports = reportRequests,
          TargetWorkspaces = workspaceRequests,
          LifetimeInMinutes = embedTokenLifetime
        };

      // call to Power BI Service API and pass GenerateTokenRequest object to generate embed token
      var EmbedTokenResult = pbiClient.EmbedToken.GenerateToken(tokenRequest);

      return new EmbeddedViewModel {
        tenantName = currentUser.TenantName,
        reports = embeddedReports,
        datasets = embeddedDatasets,
        embedToken = EmbedTokenResult.Token,
        embedTokenId = EmbedTokenResult.TokenId.ToString(),
        embedTokenExpiration = EmbedTokenResult.Expiration,
        user = currentUser.LoginId,
        userCanEdit = currentUser.CanEdit,
        userCanCreate = currentUser.CanCreate
      };

    }

    public async Task<EmbedTokenResult> GetEmbedToken(string user) {

      AppOwnsDataModels.User currentUser = this.appOwnsDataDBService.GetUser(user);

      if (currentUser.TenantName == null || currentUser.TenantName == "") {
        throw new ApplicationException("User not assigned to tenant");
      }

      AppOwnsDataModels.PowerBiTenant currentTenant = appOwnsDataDBService.GetTenant(currentUser.TenantName);

      Guid workspaceId = new Guid(currentTenant.WorkspaceId);

      SetCallingContext(currentTenant.ProfileId);

      var reports = (await pbiClient.Reports.GetReportsInGroupAsync(workspaceId)).Value;
      var datasets = (await pbiClient.Datasets.GetDatasetsInGroupAsync(workspaceId)).Value;

      IList<GenerateTokenRequestV2Dataset> datasetRequests = new List<GenerateTokenRequestV2Dataset>();
      foreach (var dataset in datasets) {
        datasetRequests.Add(new GenerateTokenRequestV2Dataset(dataset.Id, xmlaPermissions: XmlaPermissions.ReadOnly));
      };

      IList<GenerateTokenRequestV2Report> reportRequests = new List<GenerateTokenRequestV2Report>();
      foreach (var report in reports) {
        Boolean userCanEdit = currentUser.CanEdit && report.ReportType.Equals("PowerBIReport");
        reportRequests.Add(new GenerateTokenRequestV2Report(report.Id, allowEdit: userCanEdit));
      };

      var workspaceRequests = new List<GenerateTokenRequestV2TargetWorkspace>();
      if (currentUser.CanCreate) {
        workspaceRequests.Add(new GenerateTokenRequestV2TargetWorkspace(workspaceId));
      }

      GenerateTokenRequestV2 tokenRequest =
        new GenerateTokenRequestV2 {
          Datasets = datasetRequests,
          Reports = reportRequests,
          TargetWorkspaces = workspaceRequests,
          LifetimeInMinutes = embedTokenLifetime
        };

      var tokenResult = pbiClient.EmbedToken.GenerateToken(tokenRequest);

      // call to Power BI Service API and pass GenerateTokenRequest object to generate embed token
      return new EmbedTokenResult {
        embedToken = tokenResult.Token,
        embedTokenId = tokenResult.TokenId.ToString(),
        embedTokenExpiration = tokenResult.Expiration
      };

    }

    public async Task<ExportedReport> ExportFile(string user, ExportFileRequestParams request) {

      AppOwnsDataModels.User currentUser = this.appOwnsDataDBService.GetUser(user);

      if (currentUser.TenantName == null || currentUser.TenantName == "") {
        throw new ApplicationException("User not assigned to tenant");
      }

      AppOwnsDataModels.PowerBiTenant currentTenant = appOwnsDataDBService.GetTenant(currentUser.TenantName);

      Guid workspaceId = new Guid(currentTenant.WorkspaceId);
      Guid reportId = new Guid(request.ReportId);

      FileFormat fileFormat;
      switch (request.ExportType.ToLower()) {
        case "pdf":
          fileFormat = FileFormat.PDF;
          break;
        case "pptx":
          fileFormat = FileFormat.PPTX;
          break;
        case "png":
          fileFormat = FileFormat.PNG;
          break;
        default:
          throw new ApplicationException("Power BI reports do not support export to " + request.ExportType);
      }

      SetCallingContext(currentTenant.ProfileId);

      var exportRequest = new ExportReportRequest {
        Format = fileFormat,
        PowerBIReportConfiguration = new PowerBIReportExportConfiguration()
      };

      if (!string.IsNullOrEmpty(request.Filter)) {
        string[] filters = request.Filter.Split(";");
        exportRequest.PowerBIReportConfiguration.ReportLevelFilters = new List<ExportFilter>();
        foreach (string filter in filters) {
          exportRequest.PowerBIReportConfiguration.ReportLevelFilters.Add(new ExportFilter(filter));
        }
      }

      if (!string.IsNullOrEmpty(request.BookmarkState)) {
        exportRequest.PowerBIReportConfiguration.DefaultBookmark = new PageBookmark { State = request.BookmarkState };
      }

      if (!string.IsNullOrEmpty(request.PageName)) {
        exportRequest.PowerBIReportConfiguration.Pages = new List<ExportReportPage>(){
          new ExportReportPage{PageName = request.PageName}
        };
        if (!string.IsNullOrEmpty(request.VisualName)) {
          exportRequest.PowerBIReportConfiguration.Pages[0].VisualName = request.VisualName;
        }
      }

      Export export = await pbiClient.Reports.ExportToFileInGroupAsync(workspaceId, reportId, exportRequest);

      string exportId = export.Id;

      do {
        System.Threading.Thread.Sleep(3000);
        export = pbiClient.Reports.GetExportToFileStatusInGroup(workspaceId, reportId, exportId);
      } while (export.Status != ExportState.Succeeded && export.Status != ExportState.Failed);

      if (export.Status == ExportState.Failed) {
        Console.WriteLine("Export failed!");
      }

      if (export.Status == ExportState.Succeeded) {
        return new ExportedReport {
          ReportName = export.ReportName,
          ResourceFileExtension = export.ResourceFileExtension,
          ReportStream = pbiClient.Reports.GetFileOfExportToFileInGroup(workspaceId, reportId, exportId)
        };
      }
      else {
        return null;
      }
    }

  }
}
