import { useState, useRef, useContext } from 'react';

import { AppContext } from "../../../AppContext";

import AppOwnsDataWebApi from './../../../services/AppOwnsDataWebApi';
import { ExportFileRequest } from '../../../models/models';

import * as powerbi from "powerbi-client";
import * as models from "powerbi-models";

import { ViewMode } from './../Report'

// ensure Power BI JavaScript API has loaded
require('powerbi-models');
require('powerbi-client');

import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Switch from '@mui/material/Switch';
import { SxProps } from '@mui/system/styleFunctionSx/styleFunctionSx';

import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import LinearProgress from '@mui/material/LinearProgress';

import Fullscreen from '@mui/icons-material/Fullscreen';
import Edit from '@mui/icons-material/Edit';
import Pageview from '@mui/icons-material/Pageview';
import Download from '@mui/icons-material/Download';
import PictureAsPdf from '@mui/icons-material/PictureAsPdf';
import Image from '@mui/icons-material/Image';
import Slideshow from '@mui/icons-material/Slideshow';
import SyncAlt from '@mui/icons-material/SyncAlt';
import Refresh from '@mui/icons-material/Refresh';
import Article from '@mui/icons-material/Article';
import Bookmark from '@mui/icons-material/Bookmark';
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown';
import SaveAs from '@mui/icons-material/SaveAs';
import Save from '@mui/icons-material/Save';
import Visibility from '@mui/icons-material/Visibility';
import FitScreen from '@mui/icons-material/FitScreen';
import PhotoSizeSelectActual from '@mui/icons-material/PhotoSizeSelectActual';

import RadioButtonUnchecked from '@mui/icons-material/RadioButtonUnchecked';
import RadioButtonChecked from '@mui/icons-material/RadioButtonChecked';
import FilterAlt from '@mui/icons-material/FilterAlt';
import MenuIcon from '@mui/icons-material/Menu';

interface ReportToolbarProps {
  report: powerbi.Report;
  editMode: boolean;
  setEditMode: (EditMode: boolean) => void;
  showNavigation: boolean;
  setShowNavigation: (ShowNavigation: boolean) => void;
  showFiltersPane: boolean;
  setShowFiltersPane: (ShowFiltersPane: boolean) => void;
  showBookmarksPane: boolean;
  setShowBookmarksPane: (ShowBookmarksPane: boolean) => void;
  viewMode: ViewMode;
  setViewMode: (VeiwModeValue: ViewMode) => void;
  setEmbedToken: (embedToken: string) => void;
  setEmbedTokenExpiration: (embedTokenExpiration: string) => void;
}

const ReportToolbar = ({ report, editMode, setEditMode, showNavigation, setShowNavigation, showFiltersPane, setShowFiltersPane,
  showBookmarksPane, setShowBookmarksPane, viewMode, setViewMode, setEmbedToken, setEmbedTokenExpiration }: ReportToolbarProps) => {

  const { embeddingData } = useContext(AppContext)
  const [anchorElementFile, setAnchorElementFile] = useState<null | HTMLElement>(null);
  const [anchorElementExport, setAnchorElementExport] = useState<null | HTMLElement>(null);
  const [anchorElementView, setAnchorElementView] = useState<null | HTMLElement>(null);
  const [anchorElementViewMode, setAnchorElementViewMode] = useState<null | HTMLElement>(null);
  const [openSaveAsDialog, setOpenSaveAsDialog] = useState(false);
  const [newReportName, setNewReportName] = useState("");
  const [openExportProgressDialog, setOpenExportProgressDialog] = useState(false);

  const refReportName = useRef<HTMLInputElement>(null);

  const menuButtonProperties: SxProps = { fontSize: "9px", color: "#555555", ml: 1 };
  const menuItemProps: SxProps = { fontSize: "11px", px: 1.5, py: 0, m: 0 };
  const menuSwitchProps: SxProps = { ml: "auto", pl: 1 };
  const menuRadioButtonProps: SxProps = { ml: "auto", pl: 1.5 };

  const onFileSave = () => {
    setAnchorElementFile(null);
    report.save()
  };

  const onFileSaveAs = () => {
    setAnchorElementFile(null);
    setNewReportName("")
    setOpenSaveAsDialog(true);
  };

  const onExportPageToPDF = async () => {

    // close Export menu and open export progress dialog
    setAnchorElementExport(null);
    setOpenExportProgressDialog(true);

    // get report data for ExportFile operation
    let reportId = report.getId();
    let currentPage = await report.getActivePage();
    let currentPageName = currentPage.name;
    let bookmark = await report.bookmarksManager.capture({ allPages: false, personalizeVisuals: false });

    // create ExportFileRequest variable with parameters for export
    const exportRequest: ExportFileRequest = {
      ReportId: reportId,
      ExportType: "PDF",
      BookmarkState: bookmark.state,
      PageName: currentPageName,
    };

    // Call ExportFile from AppOwnsDataWebApi
    await AppOwnsDataWebApi.ExportFile(exportRequest);

    // close export progress dialog
    setOpenExportProgressDialog(false);

  };

  const onExportPageToPNG = async () => {
    setAnchorElementExport(null);
    setOpenExportProgressDialog(true);
    let reportId = report.getId();
    let currentPage = await report.getActivePage();
    let currentPageName = currentPage.name;
    let bookmark = await report.bookmarksManager.capture({ allPages: false, personalizeVisuals: false });
    const exportRequest: ExportFileRequest = {
      ReportId: reportId,
      ExportType: "PNG",
      PageName: currentPageName,
      BookmarkState: bookmark.state
    };
    await AppOwnsDataWebApi.ExportFile(exportRequest);
    setOpenExportProgressDialog(false);
  };

  const onExportPageToPPTX = async () => {
    setAnchorElementExport(null);
    setOpenExportProgressDialog(true);
    let reportId = report.getId();
    let currentPage = await report.getActivePage();
    let currentPageName = currentPage.name;
    let bookmark = await report.bookmarksManager.capture({ allPages: false, personalizeVisuals: false });
    const exportRequest: ExportFileRequest = {
      ReportId: reportId,
      ExportType: "PPTX",
      PageName: currentPageName,
      BookmarkState: bookmark.state
    };
    await AppOwnsDataWebApi.ExportFile(exportRequest);
    setOpenExportProgressDialog(false);
  };

  const onExportReportToPDF = async () => {
    setAnchorElementExport(null);
    setOpenExportProgressDialog(true);

    let reportId = report.getId();
    let bookmark = await report.bookmarksManager.capture({ allPages: false, personalizeVisuals: false });

    // create ExportFileRequest variable with parameters for export
    const exportRequest: ExportFileRequest = {
      ReportId: reportId,
      ExportType: "PDF",
      BookmarkState: bookmark.state
    };

    // Call ExportFile from AppOwnsDataWebApi
    await AppOwnsDataWebApi.ExportFile(exportRequest);

    // close dialog
    setOpenExportProgressDialog(false);
  };

  const onExportReportToPNG = async () => {
    setAnchorElementExport(null);
    setOpenExportProgressDialog(true);
    let reportId = report.getId();
    let bookmark = await report.bookmarksManager.capture({ allPages: false, personalizeVisuals: false });
    const exportRequest: ExportFileRequest = {
      ReportId: reportId,
      ExportType: "PNG",
      BookmarkState: bookmark.state
    };
    await AppOwnsDataWebApi.ExportFile(exportRequest);
    setOpenExportProgressDialog(false);
  };

  const onExportReportToPPTX = async () => {
    setAnchorElementExport(null);
    setOpenExportProgressDialog(true);
    let reportId = report.getId();
    let currentPage = await report.getActivePage();
    let currentPageName = currentPage.name;
    let bookmark = await report.bookmarksManager.capture({ allPages: false, personalizeVisuals: false });
    const exportRequest: ExportFileRequest = {
      ReportId: reportId,
      ExportType: "PPTX",
      PageName: currentPageName,
      BookmarkState: bookmark.state
    };
    await AppOwnsDataWebApi.ExportFile(exportRequest);
    setOpenExportProgressDialog(false);
  };

  const onViewToggleNavigation = () => {
    setShowNavigation(!showNavigation);
    report.updateSettings({
      panes: {
        pageNavigation: { visible: !showNavigation }
      }
    });
  };

  const onViewToggleFilterPane = () => {
    setShowFiltersPane(!showFiltersPane);
    report.updateSettings({
      panes: {
        filters: { visible: !showFiltersPane, expanded: true }
      }
    });
  };

  const onViewToggleBookmarksPane = (args: any) => {
    setShowBookmarksPane(!showBookmarksPane);
    report.updateSettings({
      panes: {
        bookmarks: { visible: !showBookmarksPane }
      }
    });
  };

  const onToggleEditMode = () => {
    report.switchMode(editMode ? "view" : "edit");
    setEditMode(!editMode);
  }

  const onViewModeFitToPage = () => {
    setAnchorElementViewMode(null);
    report.updateSettings({
      layoutType: models.LayoutType.Custom,
      customLayout: { displayOption: models.DisplayOption.FitToPage }
    });
    setViewMode("FitToPage")
  };

  const onViewModeFitToWidth = () => {
    setAnchorElementViewMode(null);
    report.updateSettings({
      layoutType: models.LayoutType.Custom,
      customLayout: { displayOption: models.DisplayOption.FitToWidth }
    });
    setViewMode("FitToWidth")
  };

  const onViewModeActualSize = () => {
    setAnchorElementViewMode(null);
    report.updateSettings({
      layoutType: models.LayoutType.Custom,
      customLayout: { displayOption: models.DisplayOption.ActualSize }
    });
    setViewMode("ActualSize")
  };

  const onReportRefresh = async () => {
    report.refresh();
  };

  const onReportFullscreen = () => {
    report.fullscreen();
  };

  return (
    <>
      <Box sx={{ width: 1, backgroundColor: "#F3F2F1", p: 0, m: 0 }} >
        <Toolbar disableGutters variant='dense' sx={{ p: 0, m: 0, minHeight: "32px" }} >
          {editMode && (
            <>
              <Button startIcon={<Article />} endIcon={<KeyboardArrowDown />} sx={menuButtonProperties}
                onClick={(event) => { setAnchorElementFile(event.currentTarget); }} >
                File
              </Button>
              <Menu sx={menuItemProps} anchorEl={anchorElementFile} open={Boolean(anchorElementFile)} onClose={() => { setAnchorElementFile(null); }} >
                <MenuItem sx={menuItemProps} onClick={onFileSave} disableRipple >
                  <Save sx={{ mr: 1 }} /> Save
                </MenuItem>
                {embeddingData.userCanCreate &&
                  <>
                    <Divider sx={{ my: 0.5 }} />
                    <MenuItem sx={menuItemProps} onClick={onFileSaveAs} disableRipple >
                      <SaveAs sx={{ mr: 1 }} /> Save As
                    </MenuItem>
                  </>
                }
              </Menu>
              <Divider orientation='vertical' flexItem />
            </>
          )}
          <>
            <Button startIcon={<Download />} endIcon={<KeyboardArrowDown />} sx={menuButtonProperties}
              onClick={(event) => { setAnchorElementExport(event.currentTarget); }} >
              Export
            </Button>
            <Menu sx={menuItemProps} anchorEl={anchorElementExport} open={Boolean(anchorElementExport)}
              onClose={() => { setAnchorElementExport(null); }} >
              <MenuItem sx={menuItemProps} onClick={onExportPageToPDF}   >
                <PictureAsPdf sx={{ mr: 1 }} /> Export Current Page to PDF
              </MenuItem>
              <Divider sx={{ my: 0.5 }} />
              <MenuItem sx={menuItemProps} onClick={onExportPageToPNG} disableRipple >
                <Image sx={{ mr: 1 }} /> Export Current Page to PNG
              </MenuItem>
              <Divider sx={{ my: 0.5 }} />
              <MenuItem sx={menuItemProps} onClick={onExportPageToPPTX} disableRipple >
                <Slideshow sx={{ mr: 1 }} /> Export Current Page to PowerPoint (PPTX)
              </MenuItem>
              <Divider sx={{ my: 0.5, borderWidth: "1px", backgroundColor: "#666666" }} />
              <MenuItem sx={menuItemProps} onClick={onExportReportToPDF}  >
                <PictureAsPdf sx={{ mr: 1 }} /> Export Report to PDF
              </MenuItem>
              <Divider sx={{ my: 1.5 }} />
              <MenuItem sx={menuItemProps} onClick={onExportReportToPNG} disableRipple >
                <Image sx={{ mr: 1 }} /> Export Report to PNG
              </MenuItem>
              <Divider sx={{ my: 0.5 }} />
              <MenuItem sx={menuItemProps} onClick={onExportReportToPPTX} disableRipple >
                <Slideshow sx={{ mr: 1 }} /> Export Report to PowerPoint (PPTX)
              </MenuItem>
            </Menu>
            <Divider orientation='vertical' flexItem />
          </>

          <Button startIcon={<Visibility />} endIcon={<KeyboardArrowDown />} sx={menuButtonProperties}
            onClick={(event) => { setAnchorElementView(event.currentTarget); }} >
            View
          </Button>
          <Menu sx={menuItemProps} anchorEl={anchorElementView} open={Boolean(anchorElementView)} onClose={() => { setAnchorElementView(null); }} >
            <MenuItem sx={menuItemProps} disableRipple >
              <MenuIcon sx={{ mr: 1 }} /> Navigation Menu <Switch sx={menuSwitchProps} checked={showNavigation} onChange={onViewToggleNavigation} />
            </MenuItem>
            <Divider sx={{ my: 0.5 }} />
            <MenuItem sx={menuItemProps} disableRipple >
              <FilterAlt sx={{ mr: 1 }} /> Filter Pane <Switch sx={menuSwitchProps} checked={showFiltersPane} onChange={onViewToggleFilterPane} />
            </MenuItem>
            <Divider sx={{ my: 0.5 }} />
            <MenuItem sx={menuItemProps} disableRipple >
              <Bookmark sx={{ mr: 1 }} /> Bookmarks Pane<Switch sx={menuSwitchProps} checked={showBookmarksPane} onChange={onViewToggleBookmarksPane} />
            </MenuItem>
          </Menu>

          <Divider orientation='vertical' flexItem />

          {embeddingData.userCanEdit &&
            <>
              <Button startIcon={editMode ? <Pageview /> : <Edit />} sx={menuButtonProperties} onClick={onToggleEditMode} >
                {editMode ? "Reading View" : "Edit"}
              </Button>
              <Divider orientation='vertical' flexItem />
            </>
          }

          <Divider orientation='vertical' flexItem sx={{ ml: "auto" }} />

          <Button startIcon={<FitScreen />} endIcon={<KeyboardArrowDown />} sx={menuButtonProperties}
            onClick={(event) => { setAnchorElementViewMode(event.currentTarget); }} >
            View Mode
          </Button>
          <Menu sx={menuItemProps} anchorEl={anchorElementViewMode} open={Boolean(anchorElementViewMode)} onClose={() => { setAnchorElementViewMode(null); }} >
            <MenuItem onClick={onViewModeFitToPage} disableRipple sx={menuItemProps}  >
              <FitScreen sx={{ mr: 1 }} /> Fit to Page {viewMode === "FitToPage" ? <RadioButtonChecked sx={menuRadioButtonProps} /> : <RadioButtonUnchecked sx={menuRadioButtonProps} />}
            </MenuItem>
            <Divider sx={{ my: 0.5 }} />
            <MenuItem onClick={onViewModeFitToWidth} disableRipple sx={menuItemProps} >
              <SyncAlt sx={{ mr: 1 }} /> Fit to Width {viewMode === "FitToWidth" ? <RadioButtonChecked sx={menuRadioButtonProps} /> : <RadioButtonUnchecked sx={menuRadioButtonProps} />}
            </MenuItem>
            <Divider sx={{ my: 0.5 }} />
            <MenuItem onClick={onViewModeActualSize} disableRipple sx={menuItemProps} >
              <PhotoSizeSelectActual sx={{ mr: 1 }} /> Actual Size {viewMode === "ActualSize" ? <RadioButtonChecked sx={menuRadioButtonProps} /> : <RadioButtonUnchecked sx={menuRadioButtonProps} />}
            </MenuItem>
          </Menu>

          <Divider orientation='vertical' flexItem />

          <Button startIcon={<Refresh />} sx={menuButtonProperties} onClick={onReportRefresh} >Refresh</Button>

          <Divider orientation='vertical' flexItem />

          <Button startIcon={<Fullscreen />} sx={menuButtonProperties} onClick={onReportFullscreen}  >Full Screen</Button>

          <Divider orientation='vertical' flexItem sx={{ mr: 1 }} />

        </Toolbar>

      </Box >

      <Dialog open={openSaveAsDialog} onClose={() => { setOpenSaveAsDialog(false); }} >
        <DialogTitle>Enter report name</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You need to give this new report a name.
          </DialogContentText>
          <TextField
            onChange={(event) => { setNewReportName(event.target.value) }}
            autoFocus
            margin="dense"
            id="name"
            label="New Report Name"
            type="text"
            value={newReportName}
            fullWidth
            variant="standard"
            inputRef={refReportName}
          />
        </DialogContent>
        <DialogActions>
          <Button disabled={newReportName === ""} onClick={async () => {
            setOpenSaveAsDialog(false);
            await report.saveAs({ name: newReportName });
          }}>Save</Button>
          <Button onClick={() => { setOpenSaveAsDialog(false); }}>Cancel</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openExportProgressDialog} onClose={() => { setOpenExportProgressDialog(false); }} >
        <DialogTitle>Power BI Report Export Job in Progress</DialogTitle>
        <DialogContent >
          <DialogContentText sx={{ display: "block", verticalAlign: "middle", width: "100%", backgroundColor: "lightblue" }} >
            <LinearProgress />
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenExportProgressDialog(false); }}>Dismiss</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default ReportToolbar