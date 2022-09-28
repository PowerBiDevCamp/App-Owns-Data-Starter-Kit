import { useState, useEffect } from 'react';
import { BrowserRouter } from "react-router-dom";

import PageLayout from './components/PageLayout'
import CssBaseline from '@mui/material/CssBaseline';

import { useMsal, useIsAuthenticated, useAccount } from "@azure/msal-react";

import { AppContext } from "./AppContext";

import { PowerBiReport, PowerBiDataset } from './models/models';
import AppOwnsDataWebApi from './services/AppOwnsDataWebApi';

const App = () => {

  const isAuthenticated = useIsAuthenticated();
  const { accounts } = useMsal();
  const account = useAccount(accounts[0] || {});

  const [tenantName, setTenantName] = useState<string>(null);
  const [reports, setReports] = useState<PowerBiReport[]>(null);
  const [datasets, setDatasets] = useState<PowerBiDataset[]>(null);
  const [user, setUser] = useState<string>(null);
  const [userCanEdit, setUserCanEdit] = useState<boolean>(null);
  const [userCanCreate, setUserCanCreate] = useState<boolean>(null);
  const [workspaceArtifactsLoading, setWorkspaceArtifactsLoading] = useState<boolean>(null);

  const refreshEmbeddingData = () => {
    const refreshEmbeddingDataAsync = async () => {
      let viewModel = await AppOwnsDataWebApi.GetEmbeddingData();
      setReports(viewModel.reports);
    };
    refreshEmbeddingDataAsync();
  };

  useEffect(() => {

    const getEmbeddingDataAsync = async () => {
      setWorkspaceArtifactsLoading(true);
      let viewModel = await AppOwnsDataWebApi.GetEmbeddingData();
      setTenantName(viewModel.tenantName);
      setReports(viewModel.reports);
      setDatasets(viewModel.datasets);
      setUser(account.name);
      setUserCanEdit(viewModel.userCanEdit);
      setUserCanCreate(viewModel.userCanCreate);
      setWorkspaceArtifactsLoading(false);
    }
    if (isAuthenticated) {
      getEmbeddingDataAsync()
    };

  }, [isAuthenticated]);

  return (
    <AppContext.Provider value={{
      embeddingData: {
        tenantName: tenantName,
        reports: reports,
        datasets: datasets,
        user: user,
        userCanEdit: userCanEdit,
        userCanCreate: userCanCreate,
        workspaceArtifactsLoading: workspaceArtifactsLoading
      },
      refreshEmbeddingData: refreshEmbeddingData,
    }}>

      <CssBaseline />
      <BrowserRouter>
        <PageLayout />
      </BrowserRouter>

    </AppContext.Provider>
  )
}

export default App;