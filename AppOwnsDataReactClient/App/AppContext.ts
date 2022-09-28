
import { createContext } from 'react';

import { PowerBiReport, PowerBiDataset } from './models/models';

export interface EmbeddingData {
  tenantName: string;
  reports: PowerBiReport[];
  datasets: PowerBiDataset[];
  user: string;
  userCanEdit: boolean;
  userCanCreate: boolean;
  workspaceArtifactsLoading?: boolean;
}

export const EmbeddingDataDefaults: EmbeddingData = {
  tenantName: null,
  reports: [],
  datasets: [],
  user: null,
  userCanEdit: null,
  userCanCreate: null,
  workspaceArtifactsLoading: false,
}

export interface AppContextProps {
  embeddingData: EmbeddingData;
  refreshEmbeddingData: () => void;
}

export const AppContext = createContext<AppContextProps>({
  embeddingData: EmbeddingDataDefaults,
  refreshEmbeddingData: () => { },
});


