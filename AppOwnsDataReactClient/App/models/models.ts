
export class PowerBiReport {
  id: string;
  name: string;
  datasetId: string;
  embedUrl: string;
  reportType: string;
}

export class PowerBiDataset {
  id: string;
  name: string;
  createReportEmbedURL: string;
}

export class ViewModel {
  tenantName: string;
  reports: PowerBiReport[];
  datasets: PowerBiDataset[];
  embedToken: string;
  embedTokenExpiration: string;
  user: string;
  userCanEdit: boolean;
  userCanCreate: boolean;
}

export class EmbedTokenResult {
  embedToken: string;
  embedTokenExpiration: string;
}

export class ActivityLogEntry {
  LoginId: string;
  User: string;
  Activity: string;
  Tenant: string;
  Dataset: string;
  DatasetId: string;
  Report: string;
  ReportId: string;
  ReportType: string;
  PageName: string;
  OriginalReportId: string;
  LoadDuration: number;
  RenderDuration: number;
  CorrelationId: string;
  EmbedTokenId: string;
}

export class User {
  LoginId: string;
  UserName: string;
}

export class ExportFileRequest {
  ReportId: string;
  ExportType: "PDF" | "PNG" | "PPTX";
  Filter?: string;
  BookmarkState?: string;
  PageName?: string;
  VisualName?: string;
}
