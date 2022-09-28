import { AuthenticationResult } from '@azure/msal-browser';
import { msalInstance } from './../index';
import { userPermissionScopes } from "../AuthConfig";
import { ViewModel, EmbedTokenResult, ActivityLogEntry, User, ExportFileRequest } from '../models/models';

export default class AppOwnsDataWebApi {

  public static ApiRoot: string = "https://appownsdatawebapi.azurewebsites.net/api/";
  //public static ApiRoot: string = "https://localhost:44302/api/";

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

  static LoginUser = async (LoginId: string, UserName: string) => {

    var user = new User();
    user.LoginId = LoginId;
    user.UserName = UserName;

    var accessToken: string = await AppOwnsDataWebApi.GetAccessToken();
    var postData: string = JSON.stringify(user);

    var restUrl = AppOwnsDataWebApi.ApiRoot + "UserLogin/";

    return fetch(restUrl, {
      method: "POST",
      body: postData,
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": "Bearer " + accessToken
      }
    });
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
      .then(response => { return response; });
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
      .then(response => { return response; });
  }

  static LogActivity = async (activityLogEntry: ActivityLogEntry) => {

    var accessToken: string = await AppOwnsDataWebApi.GetAccessToken();
    var postData: string = JSON.stringify(activityLogEntry);
    var restUrl = AppOwnsDataWebApi.ApiRoot + "ActivityLog/";

    return fetch(restUrl, {
      method: "POST",
      body: postData,
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": "Bearer " + accessToken
      }
    });

  }

  static ExportFile = async (ExportRequest: ExportFileRequest): Promise<void> => {

    var restUrl: string = AppOwnsDataWebApi.ApiRoot + "ExportFile/";
    var accessToken: string = await AppOwnsDataWebApi.GetAccessToken();
    var postData: string = JSON.stringify(ExportRequest);

    let fetchResponse = await fetch(restUrl, {
      method: "POST",
      body: postData,
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": "Bearer " + accessToken
      }
    });

    const header = fetchResponse.headers.get('Content-Disposition');

    const parts = header!.split(';');
    let filename = parts[1].split('=')[1];
    let blob = await fetchResponse.blob();

    var url = window.URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

  }

}
