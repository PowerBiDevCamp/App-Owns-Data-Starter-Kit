using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Cors;

using Microsoft.Identity.Web.Resource;

using AppOwnsDataShared.Models;
using AppOwnsDataShared.Services;

namespace AppOwnsDataWebApi.Controllers {

  [ApiController]
  [Route("api/[controller]")]
  [Authorize]
  [RequiredScope("Reports.Embed")]
  [EnableCors("AllowOrigin")]
  public class ActivityLogController : ControllerBase {

    private readonly AppOwnsDataDBService appOwnsDataDBService;

    public ActivityLogController(AppOwnsDataDBService appOwnsDataDBService) {
      this.appOwnsDataDBService = appOwnsDataDBService;
    }

    [HttpPost]
    public ActionResult<ActivityLogEntry> PostActivityLogEntry(ActivityLogEntry activityLogEntry) {
      activityLogEntry = this.appOwnsDataDBService.PostActivityLogEntry(activityLogEntry);
      return Ok();
    }

  }
}
