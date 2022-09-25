import * as $ from 'jquery';
import { ViewModel, ActivityLogEntry, User } from '../models/models';

import AppSettings from '../appSettings';
import SpaAuthService from './SpaAuthService';

export default class AppOwnsDataWebApi {

  static LoginUser = async (LoginId: string, UserName: string) => {

    var user = new User();
    user.LoginId = LoginId;
    user.UserName = UserName;

    console.log("Process user login", user);

    var accessToken: string = await SpaAuthService.getAccessToken();
    var postData: string = JSON.stringify(user);

    var restUrl = AppSettings.apiRoot + "UserLogin/";
    return $.ajax({
      url: restUrl,
      method: "POST",
      contentType: "application/json",
      data: postData,
      crossDomain: true,
      headers: {
        "Accept": "application/json",
        "Authorization": "Bearer " + accessToken
      }
    });
  }

  static GetEmbeddingData = async (): Promise<ViewModel> => {

    var accessToken: string = await SpaAuthService.getAccessToken();
    var restUrl = AppSettings.apiRoot + "Embed/";

    return $.ajax({
      url: restUrl,
      crossDomain: true,
      headers: {
        "Accept": "application/json;",
        "Authorization": "Bearer " + accessToken
      }
    });
  }

  static GetEmbedToken = async (): Promise<string> => {

    var accessToken: string = await SpaAuthService.getAccessToken();
    var restUrl = AppSettings.apiRoot + "EmbedToken/";

    return $.ajax({
      url: restUrl,
      crossDomain: true,
      headers: {
        "Accept": "application/json;",
        "Authorization": "Bearer " + accessToken
      }
    });
  }

  static LogActivity = async (activityLogEntry: ActivityLogEntry) => {

    console.log("Log custom event", activityLogEntry);

    var accessToken: string = await SpaAuthService.getAccessToken();
    var postData: string = JSON.stringify(activityLogEntry);

    var restUrl = AppSettings.apiRoot + "ActivityLog/";
    return $.ajax({
      url: restUrl,
      method: "POST",
      contentType: "application/json",
      data: postData,
      crossDomain: true,
      headers: {
        "Accept": "application/json",
        "Authorization": "Bearer " + accessToken
      }
    });
  }

}
