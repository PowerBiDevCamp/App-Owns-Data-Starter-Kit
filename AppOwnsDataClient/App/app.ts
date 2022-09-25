import 'bootstrap';

import * as $ from 'jquery';

import * as powerbi from "powerbi-client";
import * as pbimodels from "powerbi-models";

require('powerbi-models');
require('powerbi-client');

import SpaAuthService from './services/SpaAuthService';
import AppOwnsDataWebApi from './services/AppOwnsDataWebApi'

import { Report, Dataset, ViewModel, ActivityLogEntry } from './models/models';

export default class App {

  // fields for UI elemenets in DOM
  private static mainBody: JQuery;
  private static topBanner: JQuery;
  private static userGreeting: JQuery;
  private static login: JQuery;
  private static logout: JQuery;
  private static viewAnonymous: JQuery;
  private static viewUnassigned: JQuery;
  private static loadingSpinner: JQuery;
  private static loadingSpinnerMessage: JQuery;
  private static viewAuthenticated: JQuery;
  private static viewAuthenticatedHeader: JQuery;
  private static tenantName: JQuery;
  private static reportsList: JQuery;
  private static datasetsList: JQuery;
  private static datasetsListContainer: JQuery;
  private static embedToolbar: JQuery;
  private static breadcrumb: JQuery;
  private static toggleEditButton: JQuery;
  private static fullScreenButton: JQuery;
  private static embedContainer: JQuery;
  private static resizedFinished: any;
  private static currentReport: powerbi.Report;
  private static layoutMode: "master" | "mobile";
  private static breakPointWidth: number = 576;

  private static powerbi: powerbi.service.Service = window.powerbi;
  private static viewModel: ViewModel;

  public static onDocumentReady = () => {

    // initialize fields for UI elemenets 
    App.mainBody = $("#main-body");
    App.topBanner = $("#top-banner");
    App.userGreeting = $("#user-greeting");
    App.login = $("#login");
    App.logout = $("#logout");
    App.viewAnonymous = $("#view-anonymous");
    App.viewUnassigned = $("#view-unassigned");
    App.loadingSpinner = $("#view-loading-spinner");
    App.loadingSpinnerMessage = $("#spinner-message");
    App.viewAuthenticated = $("#view-authenticated");
    App.viewAuthenticatedHeader = $("#view-authenticated-header");
    App.tenantName = $("#tenant-name");
    App.reportsList = $("#reports-list");
    App.datasetsList = $("#datasets-list");
    App.datasetsListContainer = $("#datasets-list-container");
    App.embedToolbar = $("#embed-toolbar");
    App.breadcrumb = $("#breadcrumb");
    App.toggleEditButton = $("#toggle-edit");
    App.fullScreenButton = $("#full-screen");
    App.embedContainer = $("#embed-container");

    // set up authentication callback
    SpaAuthService.uiUpdateCallback = App.onAuthenticationCompleted;

    App.login.on("click", async () => {
      await SpaAuthService.login();
    });

    App.logout.on("click", () => {
      SpaAuthService.logout();
      App.refreshUi();
    });

    // Comment out to disable auto-authentication on startup
    SpaAuthService.attemptSillentLogin();

    App.refreshUi();

    App.registerWindowResizeHandler();
  }

  private static refreshUi = () => {

    if (SpaAuthService.userIsAuthenticated) {
      App.userGreeting.text("Welcome " + SpaAuthService.userDisplayName);
      App.userGreeting.prop('title', 'Email: ' + SpaAuthService.userName);
      App.login.hide()
      App.logout.show();
      App.viewAnonymous.hide();
    }
    else {
      App.userGreeting.text("");
      App.login.show();
      App.logout.hide();
      App.viewAnonymous.show();
      App.viewAuthenticated.hide();
    }
  }

  private static onAuthenticationCompleted = async () => {
    App.loadingSpinnerMessage.text("Processing user login...");
    App.loadingSpinner.show(250);
    App.viewAnonymous.hide();
    await AppOwnsDataWebApi.LoginUser(SpaAuthService.userName, SpaAuthService.userDisplayName);
    App.loadingSpinner.hide();
    App.refreshUi();
    App.initializeAppData();
  }

  private static initializeAppData = async () => {

    App.loadingSpinnerMessage.text("Getting report embedding data...");
    App.loadingSpinner.show();
    App.viewAnonymous.hide();

    App.viewModel = await AppOwnsDataWebApi.GetEmbeddingData(); 

    if (App.viewModel.tenantName == "") {
      App.viewAnonymous.hide();
      App.viewAuthenticated.hide();
      App.loadingSpinner.hide();
      App.viewUnassigned.show(500);
    }
    else {
      console.log("Loading View Model", App.viewModel);
      App.loadViewModel(App.viewModel);
    }

    window.setInterval(App.reportOnExpiration, 10000);
  }

  private static loadViewModel = async (viewModel: ViewModel, reportId?: string) => {

    App.viewAuthenticated.hide();
    App.viewUnassigned.hide();

    App.powerbi.reset(App.embedContainer[0]);

    App.tenantName.text(viewModel.tenantName);
    App.reportsList = App.reportsList.empty();
    App.datasetsList = App.datasetsList.empty();

    if (viewModel.reports.length == 0) {
      App.reportsList.append($("<li>")
        .text("no reports in workspace")
        .addClass("no-content"));
    }
    else {
      viewModel.reports.forEach((report: Report) => {
        var li = $("<li>");
        li.append($("<i>").addClass("fa fa-bar-chart"));
        li.append($("<a>", {
          "href": "javascript:void(0);"
        }).text(report.name).click(() => { App.embedReport(report) }));
        App.reportsList.append(li);
      });
    }
    
    if (viewModel.userCanCreate) {
      if (viewModel.datasets.length == 0) {
        App.datasetsList.append($("<li>")
          .text("no datasets in workspace")
          .addClass("no-content"));
      }
      else {
        viewModel.datasets.forEach((dataset: Dataset) => {
          var li = $("<li>");
          li.append($("<i>").addClass("fa fa-database"));
          li.append($("<a>", {
            "href": "javascript:void(0);"
          }).text(dataset.name).click(() => { App.embedNewReport(dataset) }));
          App.datasetsList.append(li);
        });
      }
    }

    App.loadingSpinner.hide();
    App.viewAuthenticated.show();

    if (reportId !== undefined) {
      var newReport: Report = viewModel.reports.find((report) => report.id === reportId);
      App.embedReport(newReport, true);
    }
    else {
      var newReport: Report = viewModel.reports[0];
      App.embedReport(newReport, false);
    }

  }

  private static embedReport = async (report: Report, editMode: boolean = false) => {

    App.setReportLayout();

    var models = pbimodels;

    var permissions;
    if (App.viewModel.userCanEdit && App.viewModel.userCanCreate) {
      permissions = models.Permissions.All;
    }
    else if (App.viewModel.userCanEdit && !App.viewModel.userCanCreate) {
      permissions = models.Permissions.ReadWrite;
    }
    else if (!App.viewModel.userCanEdit && App.viewModel.userCanCreate) {
      permissions = models.Permissions.Copy;
    }
    else if (!App.viewModel.userCanEdit && !App.viewModel.userCanCreate) {
      permissions = models.Permissions.Read;
    }

    App.setLayoutMode();
    var layoutMode: pbimodels.LayoutType =
      App.layoutMode == "master" ?
        models.LayoutType.Master :
        models.LayoutType.MobilePortrait;

    var config: powerbi.IReportEmbedConfiguration = {
      type: 'report',
      id: report.id,
      embedUrl: report.embedUrl,
      accessToken: App.viewModel.embedToken,
      tokenType: models.TokenType.Embed,
      permissions: permissions,
      viewMode: editMode ? models.ViewMode.Edit : models.ViewMode.View,
      settings: {
        layoutType: layoutMode,
        background: models.BackgroundType.Transparent,
        panes: {
          filters: { visible: false },
          pageNavigation: { visible: true, position: models.PageNavigationPosition.Left }
        }
      }
    };

    App.powerbi.reset(App.embedContainer[0]);

    var timerStart: number = Date.now();
    var initialLoadComplete: boolean = false;
    var loadDuration: number;
    var renderDuration: number;
    App.currentReport = <powerbi.Report>App.powerbi.embed(App.embedContainer[0], config);

    App.currentReport.off("loaded")
    App.currentReport.on("loaded", async (event: any) => {
      loadDuration = Date.now() - timerStart;
      App.setReportLayout();
    });

    App.currentReport.off("rendered");
    App.currentReport.on("rendered", async (event: any) => {

      if (!initialLoadComplete) {
        renderDuration = Date.now() - timerStart;
        var correlationId: string = await App.currentReport.getCorrelationId();
        await App.logViewReportActivity(correlationId, App.viewModel.embedTokenId, report, loadDuration, renderDuration);
        initialLoadComplete = true;
      }

    });

    App.currentReport.off("saved");
    App.currentReport.on("saved", async (event: any) => {
      if (event.detail.saveAs) {
        console.log("SaveAs Event", event);
        var orginalReportId = report.id;
        var reportId: string = event.detail.reportObjectId;
        var reportName: string = event.detail.reportName;
        await App.logCopyReportActivity(report, reportId, reportName, App.viewModel.embedTokenId);
        App.viewModel = await AppOwnsDataWebApi.GetEmbeddingData();
        App.loadViewModel(App.viewModel, reportId);
      }
      else {
        console.log("Save Event", event);
        await App.logEditReportActivity(report, App.viewModel.embedTokenId);
      }
    });

    var viewMode = editMode ? "edit" : "view";

    App.breadcrumb.text("Reports > " + report.name);    

    if (!App.viewModel.userCanEdit || report.reportType != "PowerBIReport") {
      console.log("Hiding toggle edit");
      App.toggleEditButton.hide();
    }
    else {
      App.toggleEditButton.show();
      App.toggleEditButton.on("click", () => {
        // toggle between view and edit mode
        viewMode = (viewMode == "view") ? "edit" : "view";
        App.currentReport.switchMode(viewMode);
        // show filter pane when entering edit mode
        var showFilterPane = (viewMode == "edit");
        App.currentReport.updateSettings({
          panes: {
            filters: { visible: showFilterPane, expanded: false }
          }
        });
      });
    }

    App.fullScreenButton.on("click", () => {
      App.currentReport.fullscreen();
    });

  }

  private static embedNewReport = (dataset: Dataset) => {

    var models = pbimodels;

    var config: powerbi.IEmbedConfiguration = {
      datasetId: dataset.id,
      embedUrl: "https://app.powerbi.com/reportEmbed",
      accessToken: App.viewModel.embedToken,
      tokenType: models.TokenType.Embed,
      settings: {
        panes: {
          filters: { visible: true, expanded: false }
        }
      }
    };


    // Embed the report and display it within the div container.
    App.powerbi.reset(App.embedContainer[0]);
    var embeddedReport = App.powerbi.createReport(App.embedContainer[0], config);

    $("#breadcrumb").text("Datasets > " + dataset.name + " > New Report");
    $("#embed-toolbar").show();

    $("#toggle-edit").hide();
    $("#full-screen").off("click");
    $("#full-screen").on("click", () => {
      embeddedReport.fullscreen();
    });

    // handle save action on new report
    embeddedReport.on("saved", async (event: any) => {
      console.log("Create Report Event", event);
      var reportId: string = event.detail.reportObjectId;
      var reportName: string = event.detail.reportName;
      await App.logCreateReportActivity(dataset, reportId, reportName, App.viewModel.embedTokenId);
      App.viewModel = await AppOwnsDataWebApi.GetEmbeddingData();
      App.loadViewModel(App.viewModel, reportId);
    });

  };

  private static setLayoutMode = () => {
    let useMobileLayout: boolean = (App.mainBody.width() < App.breakPointWidth);
    App.layoutMode = useMobileLayout ? "mobile" : "master";
  };

  private static setReportLayout = async () => {

    let useMobileLayout: boolean = (App.mainBody.width() < App.breakPointWidth);
    // check to see if layout mode switches between master and mobile
    if ((useMobileLayout && App.layoutMode == "master") ||
      (!useMobileLayout && App.layoutMode == "mobile")) {
     if (App.currentReport) {
        console.log("switching layout mode...")
        App.layoutMode = useMobileLayout ? "mobile" : "master";
        let sameReport: Report = App.viewModel.reports.find(async (report) => report.id === await App.currentReport.getId());
        App.embedReport(sameReport);
      }
    }
    else {
      var models = pbimodels;
      if (useMobileLayout) {
        App.tenantName.hide();
        App.toggleEditButton.hide();
        App.fullScreenButton.hide();
        App.datasetsListContainer.hide();
        $(App.embedContainer).height($(App.embedContainer).width() * 3);
      }
      else {
        // set to landscape for full browser view
        App.tenantName.show();
        App.fullScreenButton.show();
        if (App.viewModel && App.viewModel.userCanCreate) {
          App.datasetsListContainer.show();
        }
        else {
          App.datasetsListContainer.hide();
        }
        let availableHeight: number = $(window).height() - (App.topBanner.height() + App.viewAuthenticatedHeader.height()) - 8;
        let heightFromWidth = $(App.embedContainer).width() * (9/16);
        let height = Math.min(availableHeight, heightFromWidth);
        $(App.embedContainer).height(height);
      }
    }

  };

  private static logViewReportActivity = async (correlationId: string, embedTokenId: string, report: Report, loadDuration: number, renderDuration) => {
    var logEntry: ActivityLogEntry = new ActivityLogEntry();
    logEntry.CorrelationId = correlationId;
    logEntry.EmbedTokenId = embedTokenId;
    logEntry.Activity = "ViewReport";
    logEntry.LoginId = App.viewModel.user;
    logEntry.Tenant = App.viewModel.tenantName;
    logEntry.Report = report.name;
    logEntry.ReportId = report.id;
    logEntry.DatasetId = report.datasetId;
    logEntry.Dataset = (App.viewModel.datasets.find((dataset) => dataset.id === report.datasetId)).name;
    logEntry.LoadDuration = loadDuration;
    logEntry.RenderDuration = renderDuration;
    await AppOwnsDataWebApi.LogActivity(logEntry);
  };

  private static logEditReportActivity = async (report: Report, embedTokenId: string) => {
    var logEntry: ActivityLogEntry = new ActivityLogEntry();
    logEntry.CorrelationId = "";
    logEntry.Activity = "EditReport";
    logEntry.LoginId = App.viewModel.user;
    logEntry.Tenant = App.viewModel.tenantName;
    logEntry.Report = report.name;
    logEntry.ReportId = report.id;
    logEntry.DatasetId = report.datasetId;
    logEntry.EmbedTokenId = embedTokenId;
    logEntry.Dataset = (App.viewModel.datasets.find((dataset) => dataset.id === report.datasetId)).name;
    await AppOwnsDataWebApi.LogActivity(logEntry);
  };

  private static logCopyReportActivity = async (orginalReport: Report, reportId: string, reportName, embedTokenId: string) => {
    var logEntry: ActivityLogEntry = new ActivityLogEntry();
    logEntry.Activity = "CopyReport";
    logEntry.LoginId = App.viewModel.user;
    logEntry.Tenant = App.viewModel.tenantName;
    logEntry.Report = reportName;
    logEntry.ReportId = reportId;
    logEntry.OriginalReportId = orginalReport.id;
    logEntry.DatasetId = orginalReport.datasetId;
    logEntry.EmbedTokenId = embedTokenId;
    logEntry.Dataset = (App.viewModel.datasets.find((dataset) => dataset.id === orginalReport.datasetId)).name;
    await AppOwnsDataWebApi.LogActivity(logEntry);
  };

  private static logCreateReportActivity = async (dataset: Dataset, reportId: string, reportName, embedTokenId: string) => {
    var logEntry: ActivityLogEntry = new ActivityLogEntry();
    logEntry.Activity = "CreateReport";
    logEntry.LoginId = App.viewModel.user;
    logEntry.Tenant = App.viewModel.tenantName;
    logEntry.Report = reportName;
    logEntry.ReportId = reportId;
    logEntry.DatasetId = dataset.id;
    logEntry.Dataset = dataset.name;
    logEntry.EmbedTokenId = embedTokenId;
    await AppOwnsDataWebApi.LogActivity(logEntry);
  };

  private static registerWindowResizeHandler = async () => {
    $(window).resize(async function () {
      clearTimeout(App.resizedFinished);
      App.resizedFinished = setTimeout(async function () {
        App.setReportLayout();
      }, 100);
    });
  }

  private static reportOnExpiration = async () => {
    var secondsToExpire = Math.floor((new Date(App.viewModel.embedTokenExpiration).getTime() - new Date().getTime()) / 1000);   
    var minutes = Math.floor(secondsToExpire / 60);
    var seconds = secondsToExpire % 60;
    var timeToExpire = minutes + ":" + seconds;
    console.log("Token expires in ", timeToExpire);
  };

}

$(App.onDocumentReady);
