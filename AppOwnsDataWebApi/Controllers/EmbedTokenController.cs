using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Identity.Web.Resource;
using Microsoft.AspNetCore.Cors;
using AppOwnsDataWebApi.Services;

namespace AppOwnsDataWebApi.Controllers {

  [ApiController]
  [Route("api/[controller]")]
  [Authorize]
  [RequiredScope("Reports.Embed")]
  [EnableCors("AllowOrigin")]
  public class EmbedTokenController : ControllerBase {

    private PowerBiServiceApi powerBiServiceApi;

    public EmbedTokenController(PowerBiServiceApi powerBiServiceApi) {
      this.powerBiServiceApi = powerBiServiceApi;
    }

    [HttpGet]
    public async Task<string> Get() {
      string user = this.User.FindFirst("preferred_username").Value;
      return await this.powerBiServiceApi.GetEmbedToken(user);
    }

  }

}
