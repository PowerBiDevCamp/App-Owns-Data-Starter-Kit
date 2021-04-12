export default class AppSettings {
  public static clientId: string = "f99977a5-f476-4a39-bfc7-9cf2f4bd1b9e";
  public static tenant: string = "common";
  // this is WebAPI URL for local development
  public static apiRoot: string = "https://localhost:44302/api/";
  public static apiScopes: string[] = [
    "api://" + AppSettings.clientId + "/Reports.Embed"
  ];
}