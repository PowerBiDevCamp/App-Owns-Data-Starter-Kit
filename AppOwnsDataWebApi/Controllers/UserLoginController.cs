using Microsoft.AspNetCore.Mvc;
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
      string authenticatedUser = this.User.FindFirst("preferred_username").Value;
      if (user.LoginId.Equals(authenticatedUser)) {
        this.appOwnsDataDBService.ProcessUserLogin(user);
        return NoContent();
      }
      else {
        return Forbid();
      }
    }
  }
}
