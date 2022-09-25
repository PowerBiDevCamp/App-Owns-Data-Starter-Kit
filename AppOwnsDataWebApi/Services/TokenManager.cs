using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Identity.Client;

namespace AppOwnsDataWebApi.Services {

  public class TokenManager {

    private string TenantId { get; }
    private string ClientId { get; }
    private string ClientSecret { get; }
    private string[] PowerBiScopes { get; }

    private static string CachedToken { get; set; }
    private static DateTime CachedTokenExpires { get; set; }
    private int embedTokenLifetime { get; set; }

    public TokenManager(IConfiguration configuration) {
      this.TenantId = configuration["ServicePrincipalApp:TenantId"];
      this.ClientId = configuration["ServicePrincipalApp:ClientId"];
      this.ClientSecret = configuration["ServicePrincipalApp:ClientSecret"];
      this.embedTokenLifetime = int.Parse(configuration["PowerBi:EmbedTokenLifetime"]);
      this.PowerBiScopes = new string[] { "https://analysis.windows.net/powerbi/api/.default" };
    }

    public string getAccessToken() {

      Boolean noToken = string.IsNullOrEmpty(CachedToken);
      Boolean tokenExpired = (DateTime.UtcNow > CachedTokenExpires);

      if ( noToken || tokenExpired ) {
        refreshAccessToken();
      }

      return CachedToken;
    }

    public void refreshAccessToken() {

      var app = ConfidentialClientApplicationBuilder.Create(this.ClientId)
        .WithTenantId(this.TenantId)
        .WithClientSecret(this.ClientSecret)
        .Build();

      var accessTokenRequest = app.AcquireTokenForClient(this.PowerBiScopes).ExecuteAsync().Result; ;

      CachedToken = accessTokenRequest.AccessToken;
      int MinimumTokenLifetime = embedTokenLifetime * 60; // minutes * seconds
      CachedTokenExpires = accessTokenRequest.ExpiresOn.DateTime.AddSeconds(-MinimumTokenLifetime);
    }
   
  }

}
