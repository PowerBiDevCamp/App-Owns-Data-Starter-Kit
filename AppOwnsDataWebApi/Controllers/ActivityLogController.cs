using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ActivityLogEntry>>> GetActivityLog() {
      return await this.appOwnsDataDBService.GetActivityLog();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ActivityLogEntry>> GetActivityLogEntry(int id) {
      var activityLogEntry = await this.appOwnsDataDBService.GetActivityLogEntry(id);
      if (activityLogEntry == null) {
        return NotFound();
      }
      return activityLogEntry;
    }

    [HttpPost]
    public ActionResult<ActivityLogEntry> PostActivityLogEntry(ActivityLogEntry activityLogEntry) {
      activityLogEntry = this.appOwnsDataDBService.PostActivityLogEntry(activityLogEntry);
      return CreatedAtAction("GetActivityLogEntry", new { id = activityLogEntry.Id }, activityLogEntry);
    }

  }
}
