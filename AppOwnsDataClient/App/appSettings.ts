export default class AppSettings {

  // replace with production URL after deploying Web API
  public static apiRoot: string = "https://localhost:44302/api/"; 

  // setting for Azure AD app which supports SPA authentication
  public static tenant: string = "11111111-1111-1111-1111-111111111111";
  public static clientId: string = "22222222-2222-2222-2222-222222222222";
 
  // permission scopes required with App-Owns-Data Web API
  public static apiScopes: string[] = [
    "api://" + AppSettings.clientId + "/Reports.Embed"
  ];

}