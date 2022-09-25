import React from "react";
import ReactDOM from "react-dom/client";
import App from './App';
import { BrowserRouter } from "react-router-dom";
import { MsalProvider } from "@azure/msal-react";

import AppOwnsDataWebApi from './services/AppOwnsDataWebApi';

import { PublicClientApplication, EventType, EventMessage, AuthenticationResult } from "@azure/msal-browser";
import { msalConfig } from "./AuthConfig";

export const msalInstance = new PublicClientApplication(msalConfig);

// Account selection logic is app dependent. Adjust as needed for different use cases.
const accounts = msalInstance?.getAllAccounts();
if (accounts && accounts.length > 0) {
    msalInstance?.setActiveAccount(accounts[0]);
}

msalInstance.addEventCallback((event: EventMessage) => {
    if ((msalInstance?.getAllAccounts().length > 0) && event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
        const payload = event.payload as AuthenticationResult;
        const account = payload.account;
        msalInstance?.setActiveAccount(account);
        console.log("Set active MSAL  user: ", account);
        AppOwnsDataWebApi.LoginUser(account.username, account.name)
    }
});

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
    <React.StrictMode>
        <MsalProvider instance={msalInstance} >
            <App />
        </MsalProvider>
    </React.StrictMode>
);