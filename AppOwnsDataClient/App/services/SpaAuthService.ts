import * as msal from "@azure/msal-browser";
import AppSettings from './../appSettings';

export default class SpaAuthService {

  private static clientId: string = AppSettings.clientId;
  private static authority: string = "https://login.microsoftonline.com/" + AppSettings.tenant;

  public static userIsAuthenticated: boolean = false;
  public static userDisplayName: string = "";
  public static userName: string = "";
  public static uiUpdateCallback: any;

  private static msalConfig: msal.Configuration = {
    auth: {
      clientId: SpaAuthService.clientId,
      authority: SpaAuthService.authority,
    },
    cache: {
      cacheLocation: "localStorage",
      storeAuthStateInCookie: true
    }
  };

  private static publicApplication: msal.PublicClientApplication =
                 new msal.PublicClientApplication(SpaAuthService.msalConfig);

  static attemptSillentLogin = async () => {
    var userInfo: msal.AccountInfo = SpaAuthService.publicApplication.getAllAccounts()[0];
    if (userInfo) {
      SpaAuthService.userName = userInfo.username;
      SpaAuthService.userDisplayName = userInfo.name;
      SpaAuthService.userIsAuthenticated = true;
      SpaAuthService.uiUpdateCallback();
    }
  }

  static login = async () => {
    var loginRequest: msal.PopupRequest = { scopes: AppSettings.apiScopes }
    var loginResult: msal.AuthenticationResult = await SpaAuthService.publicApplication.loginPopup(loginRequest);
    var userInfo: msal.AccountInfo = loginResult.account;
    SpaAuthService.userName = userInfo.username;
    SpaAuthService.userDisplayName = userInfo.name;
    SpaAuthService.userIsAuthenticated = true;
    SpaAuthService.uiUpdateCallback();
  }

  static logout = () => {
    SpaAuthService.userName = "";
    SpaAuthService.userDisplayName = "";
    SpaAuthService.userIsAuthenticated = false;
    SpaAuthService.publicApplication.logout();
  }

  static async getAccessToken(): Promise<string> {

    var tokenRequest: msal.SilentRequest = {
      scopes: AppSettings.apiScopes,
      account: SpaAuthService.publicApplication.getAccountByUsername(SpaAuthService.userName)
    };

    var tokenReponse: msal.AuthenticationResult;
    try {
      tokenReponse = <msal.AuthenticationResult>(await SpaAuthService.publicApplication.acquireTokenSilent(tokenRequest));
    }
    catch (error) {
      if (error instanceof msal.InteractionRequiredAuthError) {
        tokenReponse = await SpaAuthService.publicApplication.acquireTokenPopup(tokenRequest);
      }
      else {
        throw error;
      }
    }
    // return access token to caller 
    var accessToken: string = tokenReponse.accessToken;
    return accessToken;
  }

}
