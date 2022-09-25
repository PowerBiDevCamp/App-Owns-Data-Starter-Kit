using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Cors;

using Microsoft.Identity.Web.Resource;

using AppOwnsDataWebApi.Models;
using AppOwnsDataWebApi.Services;
using System.Threading.Tasks;
using System;
using System.Net.Http.Headers;

namespace AppOwnsDataWebApi.Controllers {


  [ApiController]
  [Route("api/[controller]")]
  [Authorize]
  [RequiredScope("Reports.Embed")]
  [EnableCors("AllowOrigin")]
  public class ExportFileController : ControllerBase {

    private PowerBiServiceApi powerBiServiceApi;

    public ExportFileController(PowerBiServiceApi powerBiServiceApi) {
      this.powerBiServiceApi = powerBiServiceApi;
    }

    [HttpPost]
    public async Task<FileStreamResult> PostExportFile([FromBody] ExportFileRequestParams exportRequest) {

      string user = this.User.FindFirst("preferred_username").Value;

      var exportedReport = await this.powerBiServiceApi.ExportFile(user, exportRequest);
      exportedReport.ReportStream.Flush();


      Response.Headers.Add("Access-Control-Expose-Headers", "Content-Disposition");

      string fileName = exportedReport.ReportName + exportedReport.ResourceFileExtension;
      Response.Headers.Add("Content-Disposition", "attachment;filename=s" + fileName);

      string contentType = getContentTypeFromExtension(exportedReport.ResourceFileExtension);
      var file = new FileStreamResult(exportedReport.ReportStream, contentType);
      file.FileDownloadName = fileName;
      return file;

    }

    private string getContentTypeFromExtension(string extension) {
      switch (extension) {
        case ".pdf":
          return "application/pdf";
        case ".pptx":
          return "application/pptx";
        case ".zip":
          return "application/zip";
        case ".png":
          return "image/png";
        default:
          throw new ApplicationException("Cannot handle extension of " + extension);
      }
    }



  }

}
