import { useEffect, useLayoutEffect, useState, useRef, useContext } from 'react';
import { useNavigate, useParams } from "react-router-dom";

import { useMsal, useIsAuthenticated, useAccount } from "@azure/msal-react";

import { AppContext } from "../../AppContext";

import ReportPath from './report/ReportPath'
import ReportToolbar from './report/ReportToolbar';
import NewReportToolbar from './report/NewReportToolbar';
import PageNotAccessible from '../PageNotAccessible';
import DataLoading from './../DataLoading';

import AppOwnsDataWebApi from './../../services/AppOwnsDataWebApi';
import { PowerBiReport, PowerBiDataset, EmbedTokenResult, ActivityLogEntry } from '../../models/models';

import * as powerbi from "powerbi-client";
import * as models from "powerbi-models";

// ensure Power BI JavaScript API has loaded
require('powerbi-models');
require('powerbi-client');

import { Box } from '@mui/material';

export type ViewMode = "FitToPage" | "FitToWidth" | "ActualSize";

const Report = () => {

  const embedContainer = useRef(null);
  const isAuthenticated = useIsAuthenticated();
  const { accounts } = useMsal();
  const account = useAccount(accounts[0] || {});

  const navigate = useNavigate();

  const { id } = useParams();

  const { embeddingData, refreshEmbeddingData } = useContext(AppContext);

  const [embedToken, setEmbedToken] = useState<string>(null);
  const [embedTokenExpiration, setEmbedTokenExpiration] = useState<string>(null);
  const [embedTokenAcquired, setEmbedTokenAcquired] = useState<boolean>(false);
  const [embedTokenExpirationDisplay, setEmbedTokenExpirationDisplay] = useState<string>("");
  const [embeddedReport, setEmbeddedReport] = useState<powerbi.Report | null>(null);
  const [embeddedNewReport, setEmbeddedNewReport] = useState<powerbi.Embed | null>(null);
  const [embedType, setEmbedType] = useState<"ExistingReport" | "NewReport" | null>(null);
  const [reportType, setReportType] = useState<"PowerBiReport" | "PaginatedReport" | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("FitToPage");
  const [editMode, setEditMode] = useState(false);
  const [showNavigation, setShowNavigation] = useState(true);
  const [showFiltersPane, setShowFiltersPane] = useState(true);
  const [showBookmarksPane, setShowBookmarksPane] = useState(false);
  const [reportPath, setReportPath] = useState("");

  const embedExistingReport = async (Report: PowerBiReport) => {

    setEmbedType("ExistingReport");
    setReportType("PowerBiReport");

    const params = new URLSearchParams(window.location.search);
    const openInEditMode = (params.get('edit') === "true");
    setEditMode(openInEditMode);

    const defaultShowNavigation: boolean = true;
    setShowNavigation(defaultShowNavigation);
    const defaultShowFilterPane: boolean = false;
    setShowFiltersPane(defaultShowFilterPane);
    const defaultShowBookmarksPane: boolean = false;
    setShowBookmarksPane(defaultShowBookmarksPane);
    const defaultViewMode = 'FitToPage';
    setViewMode(defaultViewMode);

    if (Report?.name) {
      setReportPath(embeddingData.tenantName + " > " + Report.name);
    }
    else {
      setReportPath("...");
    }

    // determine permissions for embedded report
    var permissions;
    if (embeddingData.userCanEdit && embeddingData.userCanCreate) {
      permissions = models.Permissions.All;
    }
    else if (embeddingData && !embeddingData.userCanCreate) {
      permissions = models.Permissions.ReadWrite;
    }
    else if (!embeddingData.userCanEdit && embeddingData.userCanCreate) {
      permissions = models.Permissions.Copy;
    }
    else if (!embeddingData.userCanEdit && !embeddingData.userCanCreate) {
      permissions = models.Permissions.Read;
    }

    var config: powerbi.IReportEmbedConfiguration = {
      type: 'report',
      id: Report.id,
      embedUrl: Report.embedUrl,
      accessToken: embedToken,
      tokenType: models.TokenType.Embed,
      viewMode: openInEditMode ? models.ViewMode.Edit : models.ViewMode.View,
      permissions: permissions,
      settings: {
        bars: {
          actionBar: { visible: false }
        },
        panes: {
          pageNavigation: { visible: defaultShowNavigation, position: models.PageNavigationPosition.Left },
          filters: { visible: defaultShowFilterPane, expanded: false },
          bookmarks: { visible: defaultShowBookmarksPane }
        }
      }
    };

    // set up variables to collect performance data for report loading
    var timerStart: number = Date.now();
    var initialLoadComplete: boolean = false;
    var pageChangeInProgress: boolean = false;
    var loadDuration: number;
    var renderDuration: number;

    // Embed the report and display it within the div container
    window.powerbi.reset(embedContainer.current);
    var embeddedReport: powerbi.Report = (window.powerbi.embed(embedContainer.current, config) as powerbi.Report);

    console.log(embeddedReport);

    setEmbeddedReport(embeddedReport);
    setEmbeddedNewReport(null);


    embeddedReport.off("loaded")
    embeddedReport.on("loaded", async (event: any) => {
      loadDuration = Date.now() - timerStart;
    });

    embeddedReport.off("rendered");
    embeddedReport.on("rendered", async (event: any) => {
      if (!initialLoadComplete) {
        renderDuration = Date.now() - timerStart;
        var correlationId: string = await embeddedReport.getCorrelationId();
        var pageName: string = Report.reportType === "PowerBIReport" ? (await embeddedReport.getActivePage()).displayName : "";
        await logViewReportActivity(correlationId, Report, pageName, loadDuration, renderDuration);
        initialLoadComplete = true;
      }
      if (pageChangeInProgress) {
        pageChangeInProgress = false;
        renderDuration = Date.now() - timerStart;
        var correlationId: string = await embeddedReport.getCorrelationId();
        var pageName: string = (await embeddedReport.getActivePage()).displayName;
        await logPageChangedActivity(correlationId, Report, pageName, renderDuration);

      }
    });

    embeddedReport.off("pageChanged");
    embeddedReport.on("pageChanged", async (event: any) => {
      if (initialLoadComplete) {
        pageChangeInProgress = true;
        timerStart = Date.now();
      }
      else {

      }
    });

    embeddedReport.on("saved", async (event: any) => {

      if (event.detail.saveAs) {
        // handle save-as to to create new report as copy
        await refreshEmbedToken();
        refreshEmbeddingData();
        var newReportId = event.detail.reportObjectId;
        var newReportName = event.detail.reportName;
        logCopyReportActivity(Report, newReportId, newReportName);
        navigate("/reports/" + newReportId + "/?edit=true");
      }
      else {
        // handle save to to edit exisitng report
        logEditReportActivity(Report);
      }

    });

    embeddedReport.on("error", (event: any) => {
      console.log("ERROR in embedded report", event);
    });

  };

  const embedNewReport = async (Dataset: PowerBiDataset) => {

    setEmbedType("NewReport");
    setReportType("PowerBiReport");

    if (Dataset?.name) {
      setReportPath(embeddingData.tenantName + " > New Report [not saved]");
    }
    else {
      setReportPath("...");
    }

    var config: powerbi.IEmbedConfiguration = {
      type: 'report',
      datasetId: Dataset.id,
      embedUrl: Dataset.createReportEmbedURL,
      accessToken: embedToken,
      tokenType: models.TokenType.Embed,
      settings: {
        bars: {
          actionBar: { visible: false }
        },
        panes: {
          filters: { expanded: false, visible: true }
        }
      }
    };

    // Embed the report and display it within the div container.
    var embeddedNewReport: powerbi.Embed = window.powerbi.createReport(embedContainer.current, config);

    setEmbeddedNewReport(embeddedNewReport);
    setEmbeddedReport(null);

    embeddedNewReport.on("saved", async (event: any) => {
      await refreshEmbedToken();
      refreshEmbeddingData();
      // get ID and name of new report
      var newReportId = event.detail.reportObjectId;
      var newReportName = event.detail.reportName;
      logCreateReportActivity(Dataset, newReportId, newReportName);
      navigate("/reports/" + newReportId + "/?edit=true&newReport=true");
    });


    embeddedNewReport.on("error", (event: any) => {
      console.log("ERROR in embedded report", event);
    });

  };

  const embedPaginatedReport = async (Report: PowerBiReport) => {

    window.powerbi.reset(embedContainer.current);

    if (Report?.name) {
      setReportPath(embeddingData.tenantName + " > " + Report.name);
    }
    else {
      setReportPath("...");
    }

    setEmbedType("ExistingReport");
    setReportType("PaginatedReport");

    var config: models.IPaginatedReportLoadConfiguration = {
      type: 'report',
      id: Report.id,
      embedUrl: Report.embedUrl,
      accessToken: embedToken,
      tokenType: models.TokenType.Embed,
      settings: {
        commands: {
          parameterPanel: {
            enabled: true,
            expanded: true
          }
        }
      }
    };

    console.log("Embedding paginated report");

    // Embed the report and display it within the div container                
    var embeddedReport: powerbi.Report = (window.powerbi.embed(embedContainer.current, config) as powerbi.Report);

    setEmbeddedReport(embeddedReport);
    setEmbeddedNewReport(null);

    console.log("Log paginated report veiw");
    await logViewReportActivity("", Report, "", undefined, undefined);

    embeddedReport.on("error", (event: any) => {
      console.log("ERROR in paginated report", event);
    });

  };

  // set height of embed container relative to height of window
  const setReportContainerHeight = () => {
    if (embedContainer.current) {
      var reportContainer: HTMLElement = embedContainer.current;
      var reportContainerTopPosition = reportType === "PaginatedReport" ? 76 : 109;
      reportContainer.style.height = (window.innerHeight - reportContainerTopPosition - 10) + "px";
    }
  };

  const logViewReportActivity = async (correlationId: string, report: PowerBiReport, pageName: string, loadDuration: number, renderDuration: number) => {
    var logEntry: ActivityLogEntry = new ActivityLogEntry();
    logEntry.CorrelationId = correlationId;
    logEntry.Activity = "ViewReport";
    logEntry.LoginId = account.username;
    logEntry.User = account.name;
    logEntry.Tenant = embeddingData.tenantName;
    logEntry.Report = report.name;
    logEntry.ReportId = report.id;
    logEntry.ReportType = report.reportType;
    logEntry.PageName = pageName;
    logEntry.DatasetId = report.datasetId;
    logEntry.Dataset = (embeddingData.datasets.find((dataset) => dataset.id === report.datasetId))?.name;
    logEntry.LoadDuration = loadDuration;
    logEntry.RenderDuration = renderDuration;
    await AppOwnsDataWebApi.LogActivity(logEntry);
  };

  const logPageChangedActivity = async (correlationId: string, report: PowerBiReport, pageName: string, renderDuration: number) => {
    var logEntry: ActivityLogEntry = new ActivityLogEntry();
    logEntry.CorrelationId = correlationId;
    logEntry.Activity = "PageChanged";
    logEntry.LoginId = account.username;
    logEntry.User = account.name;
    logEntry.Tenant = embeddingData.tenantName;
    logEntry.Report = report.name;
    logEntry.ReportId = report.id;
    logEntry.ReportType = report.reportType;
    logEntry.PageName = pageName;
    logEntry.DatasetId = report.datasetId;
    logEntry.Dataset = (embeddingData.datasets.find((dataset) => dataset.id === report.datasetId))?.name;
    logEntry.RenderDuration = renderDuration;
    await AppOwnsDataWebApi.LogActivity(logEntry);
  };

  const logEditReportActivity = async (report: PowerBiReport) => {
    var logEntry: ActivityLogEntry = new ActivityLogEntry();
    logEntry.CorrelationId = "";
    logEntry.Activity = "EditReport";
    logEntry.LoginId = account.username;
    logEntry.User = account.name;
    logEntry.Tenant = embeddingData.tenantName;
    logEntry.Report = report.name;
    logEntry.ReportId = report.id;
    logEntry.ReportType = "PowerBIReport";
    logEntry.DatasetId = report.datasetId;
    logEntry.Dataset = (embeddingData.datasets.find((dataset) => dataset.id === report.datasetId)).name;
    await AppOwnsDataWebApi.LogActivity(logEntry);
  };

  const logCopyReportActivity = async (orginalReport: PowerBiReport, reportId: string, reportName: string) => {
    var logEntry: ActivityLogEntry = new ActivityLogEntry();
    logEntry.Activity = "CopyReport";
    logEntry.LoginId = account.username;
    logEntry.User = account.name;
    logEntry.Tenant = embeddingData.tenantName;
    logEntry.Report = reportName;
    logEntry.ReportId = reportId;
    logEntry.ReportType = "PowerBIReport";
    logEntry.OriginalReportId = orginalReport.id;
    logEntry.DatasetId = orginalReport.datasetId;
    logEntry.Dataset = (embeddingData.datasets.find((dataset) => dataset.id === orginalReport.datasetId)).name;
    await AppOwnsDataWebApi.LogActivity(logEntry);
  };

  const logCreateReportActivity = async (dataset: PowerBiDataset, reportId: string, reportName: string) => {
    var logEntry: ActivityLogEntry = new ActivityLogEntry();
    logEntry.Activity = "CreateReport";
    logEntry.LoginId = account.username;
    logEntry.User = account.name;
    logEntry.Tenant = embeddingData.tenantName;
    logEntry.Report = reportName;
    logEntry.ReportId = reportId;
    logEntry.ReportType = "PowerBIReport";
    logEntry.DatasetId = dataset.id;
    logEntry.Dataset = dataset.name;
    await AppOwnsDataWebApi.LogActivity(logEntry);
  };

  const refreshEmbedToken = async () => {

    setEmbedToken(null);
    let tokenResult = await AppOwnsDataWebApi.GetEmbedToken();
    setEmbedToken(tokenResult.embedToken);
    setEmbedTokenExpiration(tokenResult.embedTokenExpiration);
    setEmbedTokenExpirationDisplay(reportOnExpiration(tokenResult.embedTokenExpiration));

    console.log("Embed token refreshed with expiration of " + tokenResult.embedTokenExpiration);

    if (embeddedReport) {
      console.log("setting refreshed access token on report ");
      embeddedReport.setAccessToken(tokenResult.embedToken);
    }

    if (embeddedNewReport) {
      console.log("setting refreshed access token on report ");
      embeddedNewReport.setAccessToken(tokenResult.embedToken);
    }

  };

  const reportOnExpiration = (EmbedTokenExpiration: string): string => {

    var secondsToExpire = Math.floor((new Date(EmbedTokenExpiration).getTime() - new Date().getTime()) / 1000);

    console.log("reportOnExpiration", secondsToExpire);

    // refresh embed token two minutes before it expires
    var minutesBeforeExpiration = 2;
    if (secondsToExpire < (60 * minutesBeforeExpiration)) {
      let response = refreshEmbedToken();
      Promise.
      response.then();
      return "Refreshing embed token...";      
    }

    var minutes = Math.floor(secondsToExpire / 60);
    var seconds = secondsToExpire % 60;
    var timeToExpire = "Token Expiration: " + String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
    return timeToExpire;
  };

  // set height of embed container DIV
  useLayoutEffect(() => {
    if (isAuthenticated && embedContainer.current) {
      setReportContainerHeight();
      window.addEventListener("resize", setReportContainerHeight);
    }
  }, [isAuthenticated, reportType, embedContainer]);

  // call Web API to retreive embed token and embed report
  useEffect(() => {
    console.log("useEffect #1");
    if (isAuthenticated) {
      console.log("useEffect #1A");
      if (!embedTokenAcquired) {
        console.log("useEffect #1AA");
        let tokenResult = AppOwnsDataWebApi.GetEmbedToken().then((tokenResult) => {
          setEmbedToken(tokenResult.embedToken);
          setEmbedTokenExpiration(tokenResult.embedTokenExpiration);
          setEmbedTokenAcquired(true);
          setEmbedTokenExpirationDisplay(reportOnExpiration(tokenResult.embedTokenExpiration));
          return;
        });
      }
      console.log("useEffect #1B");

      if (embedTokenAcquired && embedContainer.current) {
        console.log("useEffect #1BA");

        let report: PowerBiReport = embeddingData.reports?.find((report) => report.id === id);
        if (report) {
          if (report.reportType === "PowerBIReport") {
            embedExistingReport(report);
          }
          else {
            embedPaginatedReport(report);
          }
          return;
        }

        let dataset: PowerBiDataset = embeddingData.datasets?.find((dataset) => dataset.id === id);
        if (dataset) {
          embedNewReport(dataset);
          return;
        }
      }

    }

  }, [id, embeddingData, embedTokenAcquired]);

  // set up repeating effect to update display for embed token expiration time 
  useEffect(() => {
    console.log("useEffect #2");
    if (isAuthenticated && embedTokenAcquired) {
      console.log("useEffect #2A");
      window.setTimeout(() => {
        setEmbedTokenExpirationDisplay(reportOnExpiration(embedTokenExpiration));
      }, 1000);
    }
  }, [isAuthenticated, embedTokenAcquired, embedToken, embedTokenExpiration, embedTokenExpirationDisplay]);

  if (!isAuthenticated) {
    return <PageNotAccessible />;
  }
  else {
    if (embeddingData.workspaceArtifactsLoading) {
      return <DataLoading />
    }
    else {
      return (
        <Box sx={{ display: "grid", gridAutoFlow: "row", width: 1 }}>

          <ReportPath reportPath={reportPath} tokenExpiration={embedTokenExpirationDisplay} refreshEmbedToken={refreshEmbedToken} />

          {embedType === "ExistingReport" && reportType === "PowerBiReport" &&
            <ReportToolbar report={embeddedReport}
              editMode={editMode} setEditMode={setEditMode} showNavigation={showNavigation} setShowNavigation={setShowNavigation}
              showFiltersPane={showFiltersPane} setShowFiltersPane={setShowFiltersPane} viewMode={viewMode} setViewMode={setViewMode}
              showBookmarksPane={showBookmarksPane} setShowBookmarksPane={setShowBookmarksPane} setEmbedToken={setEmbedToken} setEmbedTokenExpiration={setEmbedTokenExpiration} />}

          {embedType === "NewReport" && <NewReportToolbar report={embeddedNewReport} />}

          <Box ref={embedContainer} sx={{ width: "100%", borderBottom: 1, borderBottomColor: "#CCCCCC" }} />

        </Box>
      );
    }
  }
};

export default Report;