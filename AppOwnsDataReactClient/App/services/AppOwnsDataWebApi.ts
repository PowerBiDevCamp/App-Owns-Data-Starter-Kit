
import { AuthenticationResult } from '@azure/msal-browser';
import { msalInstance } from './../index';
import { userPermissionScopes } from "../AuthConfig";
import { ViewModel, EmbedTokenResult, ActivityLogEntry, User, ExportFileRequest } from '../models/models';

export default class AppOwnsDataWebApi {

  //public static ApiRoot: string = "https://localhost:44302/api/";
  public static ApiRoot: string = "https://appownsdatawebapi.azurewebsites.net/api/";

  private static GetAccessToken = async (): Promise<string> => {

    const account = msalInstance?.getActiveAccount();

    if (account) {
      let authResult: AuthenticationResult;
      try {
        // try to acquire access token from MSAL cache first
        authResult = await msalInstance.acquireTokenSilent({ scopes: userPermissionScopes, account: account });
      }
      catch {
        // if access token not available in cache, interact with user to acquire new access token 
        authResult = await msalInstance.acquireTokenPopup({ scopes: userPermissionScopes, account: account });
      }
      // return access token from authnetication result 
      return authResult.accessToken;
    }
    else {
      return "";
    }

  };

  static LoginUser = async (LoginId: string, UserName: string): Promise<void> => {

    var user = new User();
    user.LoginId = LoginId;
    user.UserName = UserName;

    var accessToken: string = await AppOwnsDataWebApi.GetAccessToken();
    var postData: string = JSON.stringify(user);

    var restUrl = AppOwnsDataWebApi.ApiRoot + "UserLogin/";

    await fetch(restUrl, {
      method: "POST",
      body: postData,
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": "Bearer " + accessToken
      }
    });

    return;
  }

  static GetEmbeddingData = async (): Promise<ViewModel> => {

    var accessToken: string = await AppOwnsDataWebApi.GetAccessToken();
    var restUrl = AppOwnsDataWebApi.ApiRoot + "Embed/";

    return fetch(restUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json;",
        "Authorization": "Bearer " + accessToken
      }
    }).then(response => response.json())
      .then(response => response);
  }

  static GetEmbedToken = async (): Promise<EmbedTokenResult> => {

    var accessToken: string = await AppOwnsDataWebApi.GetAccessToken();
    var restUrl = AppOwnsDataWebApi.ApiRoot + "EmbedToken/";

    return fetch(restUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json;",
        "Authorization": "Bearer " + accessToken
      }
    }).then(response => response.json())
      .then(response => response);
  }

  static LogActivity = async (activityLogEntry: ActivityLogEntry): Promise<void> => {

    var accessToken: string = await AppOwnsDataWebApi.GetAccessToken();
    var postData: string = JSON.stringify(activityLogEntry);
    var restUrl = AppOwnsDataWebApi.ApiRoot + "ActivityLog/";

    let fetchResponse = await fetch(restUrl, {
      method: "POST",
      body: postData,
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": "Bearer " + accessToken
      }
    });

    return;

  }

  static ExportFile = async (ExportRequest: ExportFileRequest): Promise<void> => {

    var restUrl: string = AppOwnsDataWebApi.ApiRoot + "ExportFile/";
    var accessToken: string = await AppOwnsDataWebApi.GetAccessToken();

    // prepare JSON body for POST request to retrieve exported report file
    var postData: string = JSON.stringify(ExportRequest);

    // execute POST request synchronously to retrieve exported report file
    let fetchResponse = await fetch(restUrl, {
      method: "POST",
      body: postData,
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": "Bearer " + accessToken
      }
    });

    // Once POST call returns, get file name from HTTP response
    const header = fetchResponse.headers.get('Content-Disposition');
    const parts = header!.split(';');
    let filename = parts[1].split('=')[1];

    // get blob with export file content
    let blob = await fetchResponse.blob();

    // trigger export file download in browser window
    var url = window.URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    // return control to caller using await
    return;
  }

}



