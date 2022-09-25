using System;
using System.Collections.Generic;
using System.IO;

namespace AppOwnsDataWebApi.Models {

  public class EmbeddedReport {
    public string id;
    public string name;
    public string datasetId;
    public string embedUrl;
    public string reportType;
  }

  public class EmbeddedDataset {
    public string id;
    public string name;
    public string createReportEmbedURL;
  }

  public class EmbeddedViewModel {
    public string tenantName { get; set; }
    public List<EmbeddedReport> reports { get; set; }
    public List<EmbeddedDataset> datasets { get; set; }
    public string embedToken { get; set; }
    public string embedTokenId { get; set; }
    public DateTime embedTokenExpiration { get; set; }
    public string user { get; set; }
    public bool userCanEdit { get; set; }
    public bool userCanCreate { get; set; }
  }

  public class EmbedTokenResult{
    public string embedToken { get; set; }
    public string embedTokenId { get; set; }
    public DateTime embedTokenExpiration { get; set; }
  }

  public class ExportFileRequestParams {
    public string ReportId { get; set; }
    public string ExportType { get; set; }
    public string Filter { get; set; }
    public string BookmarkState { get; set; }
    public string PageName { get; set; }
    public string VisualName { get; set; }
  }

  public class ExportedReport {
    public string ReportName { get; set; }
    public string ResourceFileExtension { get; set; }
    public Stream ReportStream { get; set; }
  }

}
