using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AppOwnsDataShared.Models;
using AppOwnsDataShared.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Identity.Web.Resource;
using Microsoft.AspNetCore.Cors;

namespace AppOwnsDataWebApi.Controllers {

  [ApiController]
  [Route("api/[controller]")]
  [Authorize]
  [RequiredScope("Reports.Embed")]
  [EnableCors("AllowOrigin")]
  public class UserLoginController : ControllerBase {

    private AppOwnsDataDBService appOwnsDataDBService;

    public UserLoginController(AppOwnsDataDBService appOwnsDataDBService) {
      this.appOwnsDataDBService = appOwnsDataDBService;
    }

    [HttpPost]
    public ActionResult<User> PostUser(User user) {
      this.appOwnsDataDBService.ProcessUserLogin(user);
      return NoContent();
    }
  }
}
