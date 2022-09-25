import { Configuration, PopupRequest } from "@azure/msal-browser";

// Config Azure AD app setting to be passed to Msal on creation
const TenantId = "11111111-1111-1111-1111-111111111111";
const ClientId = "22222222-2222-2222-2222-222222222222";

export const msalConfig: Configuration = {
    auth: {
        clientId: ClientId,
        authority: "https://login.microsoftonline.com/" + TenantId,
        redirectUri: "/",
        postLogoutRedirectUri: "/"        
    }
};

export const userPermissionScopes: string[] = [
  "api://" + ClientId + "/Reports.Embed"
]

export const PowerBiLoginRequest: PopupRequest = {
  scopes: userPermissionScopes
};