using System.Collections.Generic;

namespace AppOwnsDataWebApi.Models {

  public class EmbeddedReport {
    public string id;
    public string name;
    public string datasetId;
    public string embedUrl;
  }

  public class EmbeddedDataset {
    public string id;
    public string name;
  }

  public class EmbeddedViewModel {
    public string tenantName { get; set; }
    public List<EmbeddedReport> reports { get; set; }
    public List<EmbeddedDataset> datasets { get; set; }
    public string embedToken { get; set; }
    public string embedTokenId { get; set; }
    public string user { get; set; }
    public bool userCanEdit { get; set; }
    public bool userCanCreate { get; set; }
  }

}
