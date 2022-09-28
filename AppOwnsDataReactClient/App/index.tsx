import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { PublicClientApplication, EventType, EventMessage, AuthenticationResult } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "./AuthConfig";

import App from './App';
import AppOwnsDataWebApi from './services/AppOwnsDataWebApi';

export const msalInstance = new PublicClientApplication(msalConfig);

let userLoginProcessed = false;

// Account selection logic is app dependent. Adjust as needed for different use cases.
const accounts = msalInstance?.getAllAccounts();
if (accounts && accounts.length > 0) {
  msalInstance?.setActiveAccount(accounts[0]);
}

msalInstance.addEventCallback(async (event: EventMessage) => {

  if ((msalInstance?.getAllAccounts().length > 0) && event.payload &&
    (event.eventType === EventType.LOGIN_SUCCESS || event.eventType === EventType.ACQUIRE_TOKEN_SUCCESS)) {
    const payload = event.payload as AuthenticationResult;
    const account = payload.account;
    msalInstance?.setActiveAccount(account);
    if (!userLoginProcessed) {
      userLoginProcessed = true;
      await AppOwnsDataWebApi.LoginUser(account.username, account.name);
    }
  }

});

const root = createRoot(document.getElementById('root'));

root.render(
  <StrictMode>
    <MsalProvider instance={msalInstance} >
      <App />
    </MsalProvider>
  </StrictMode>
);