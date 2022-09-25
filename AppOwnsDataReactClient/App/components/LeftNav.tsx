import { useState, useContext } from 'react';
import { useIsAuthenticated } from "@azure/msal-react";
import { useNavigate, useParams } from 'react-router-dom';
import { AppContext } from "../AppContext";

import { Box, Drawer, Toolbar, Typography } from '@mui/material';
import { List, ListItem, ListItemAvatar } from '@mui/material';
import { Divider, IconButton, Stack, Select, MenuItem, InputLabel, FormControl, SxProps, SelectChangeEvent } from '@mui/material';

import MenuIcon from '@mui/icons-material/Menu';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SchemaIcon from '@mui/icons-material/Schema';

import { PowerBiReport, PowerBiDataset } from '../models/models';

import DataLoading from './DataLoading';

const LeftNav = () => {
    const isAuthenticated = useIsAuthenticated();
    const navigate = useNavigate();
    const { embeddingData } = useContext(AppContext);
    const expandedLeftNavWidth = 240;
    const colapsedLeftNavWidth = 48;
    const [leftNavWidth, setLeftNavWidth] = useState(expandedLeftNavWidth);
    const [leftNavExpanded, setLeftNavExpanded] = useState(true);

    const listItemWithListProps: SxProps = {
        justifyContent: leftNavExpanded ? 'flex-start' : 'center', pl: 0, py: 0, pr: leftNavExpanded ? 1 : 0
    };

  const leftNavTopBoxProps: SxProps = { width: 1, color: "#000000", backgroundColor: "#F3F2F1", mt: "44px" };

    const leftNavOuterBoxProps: SxProps = { width: 1, display: "flex" };

    const leftNavInnerBoxLeftProps: SxProps = { 
        width: "48px", 
        minWidth: "48px", 
        textAlign: "center",
        p:0, 
        pt: "4px", 
        color: "#444444"
    };

    const avatarProps: SxProps = { width: "22px", height: "22px", m:0, mt: "2px" };

    const leftNavInnerBoxTenantNameProps: SxProps = {
        pt: "2px",
        pl: "4px",
        width: leftNavExpanded ? 1 : 0,
        maxHeight: "28px;"
    };

    const leftNavTenantNameProps: SxProps = {
        fontSize: "18px", width: 1, color: "#111111", pt: "4px"
    };

    const leftNavInnerBoxRightProps: SxProps = { 
        py: 0,
        pl: "4px", 
        width: leftNavExpanded ? 1 : 0, color: "black" };

    const leftNavHeaderProps: SxProps = {
        fontSize: "18px", width: 1, color: "#444444", pl: 0, mb: 0, my: 0, pt: "2px"
    };

    const leftNavListProps: SxProps = {
        m: 0, p: 0, pb: "8px", width: 1
    };

    const toggleLeftNavWidth = () => {
        if (leftNavExpanded) {
            setLeftNavExpanded(false);
            setLeftNavWidth(colapsedLeftNavWidth);
        }
        else {
            setLeftNavExpanded(true);
            setLeftNavWidth(expandedLeftNavWidth);
        }
    };

    return (
        <Drawer variant='permanent' anchor='left'
            sx={{ width: leftNavWidth, zIndex: 1, pt: "84px", pb: 3,
                  display: (isAuthenticated && embeddingData.tenantName && !embeddingData.workspaceArtifactsLoading) ? "flex" : "none"}}
        PaperProps={{ sx: { width: leftNavWidth, backgroundColor: "#F3F2F1", borderRight: "1px solid #444444" } }}  >

            <Box sx={leftNavTopBoxProps} >

                <Box sx={leftNavOuterBoxProps} >
                    <Box sx={leftNavInnerBoxLeftProps} >
                        <MenuIcon sx={avatarProps} onClick={toggleLeftNavWidth} />
                    </Box>
                    <Box sx={leftNavInnerBoxTenantNameProps} >
                        <Typography sx={leftNavTenantNameProps} variant='h5' fontSize={20} >{embeddingData.tenantName}</Typography>
                    </Box>
                </Box>

                <Divider sx={{backgroundColor: "#CCCCCC"}} />

                <Box sx={leftNavOuterBoxProps} >
                    <Box sx={leftNavInnerBoxLeftProps} >
                        <AssessmentIcon sx={avatarProps} />
                    </Box>
                    {leftNavExpanded &&
                        <Box sx={leftNavInnerBoxRightProps}>
                            <Typography sx={leftNavHeaderProps} variant='subtitle1' >Reports</Typography>
                            {embeddingData.workspaceArtifactsLoading && <DataLoading />}
                            {!embeddingData.workspaceArtifactsLoading && (
                                <List disablePadding dense sx={leftNavListProps}>
                                    {embeddingData.reports?.map((report: PowerBiReport) => (
                                        <ListItem button key={report.id}
                                            sx={{
                                                py: "4px", pl: "6px", width: 1,
                                                fontWeight: "bold",
                                                fontSize: "14px",
                                                color: "$222222",
                                                backgroundColor: (document.URL.includes(report.id)) ? "#DDDDDD" : "#F3F2F1",
                                                borderLeft: (document.URL.includes(report.id)) ? "4px solid #607D8B" : ""
                                            }}
                                            onClick={() => {
                                                navigate("/reports/" + report.id);
                                            }} >{report.name}</ListItem>

                                    ))}
                                </List>
                            )}
                        </Box>
                    }
                </Box>

                <Divider sx={{backgroundColor: "#CCCCCC"}} />

                {embeddingData.userCanCreate &&
                    <>
                        <Box sx={leftNavOuterBoxProps} >
                            <Box sx={leftNavInnerBoxLeftProps} >
                                <SchemaIcon sx={avatarProps} />
                            </Box>
                            {leftNavExpanded &&
                                <Box sx={leftNavInnerBoxRightProps}>
                                    <Typography sx={leftNavHeaderProps} variant='subtitle1' >Datasets</Typography>
                                    {embeddingData.workspaceArtifactsLoading && <DataLoading />}
                                    {!embeddingData.workspaceArtifactsLoading && (
                                        <List disablePadding dense sx={leftNavListProps}>
                                            {embeddingData.datasets?.map((dataset: PowerBiDataset) => (
                                                <ListItem button key={dataset.id}
                                                    sx={{
                                                        py: "4px", pl: "6px", width: 1,
                                                        fontWeight: "bold",
                                                        fontSize: "14px",
                                                        color: "$222222",
                                                        backgroundColor: (document.URL.includes(dataset.id)) ? "#DDDDDD" : "#F3F2F1",
                                                        borderLeft: (document.URL.includes(dataset.id)) ? "4px solid #455A64" : ""
                                                    }}
                                                    onClick={() => {
                                                        navigate("/reports/" + dataset.id);
                                                    }} >{dataset.name}</ListItem>
                                            ))}
                                        </List>
                                    )}
                                </Box>
                            }
                        </Box>
                        <Divider sx={{backgroundColor: "#CCCCCC"}} />
                    </>}
            </Box>
        </Drawer >
    )
}

export default LeftNav