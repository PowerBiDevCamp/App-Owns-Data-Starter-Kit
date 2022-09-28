import { useContext } from 'react';
import { useNavigate } from "react-router-dom";
import { useMsal, useIsAuthenticated, useAccount } from "@azure/msal-react";

import { AppContext } from "../../AppContext";

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import Paper from '@mui/material/Paper';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Grid from '@mui/material/Grid';
import Avatar from '@mui/material/Avatar';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Typography from '@mui/material/Typography';

import Assessment from '@mui/icons-material/Assessment';
import Schema from '@mui/icons-material/Schema';

import DataLoading from './../DataLoading';

const Home = () => {
  const isAuthenticated = useIsAuthenticated();
  const { accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const navigate = useNavigate();
  const { embeddingData } = useContext(AppContext);

  if (!isAuthenticated) {
    return (
      <Container maxWidth={false}>
        <Typography variant='h5' component="h2" sx={{ my: 3 }} >Welcome to the App-Owns-Data Starter Kit</Typography>
        <Alert sx={{ border: 1, padding: 2, mx: 2 }} severity='info' >Click the <strong>LOGIN</strong> button in the upper right to get started.</Alert>
      </Container>
    )
  }

  if (isAuthenticated && embeddingData.user && !embeddingData.tenantName) {
    return (
      <Container maxWidth={false}>
        <Typography variant='h5' component="h2" sx={{ my: 3 }} >Welcome to the App-Owns-Data Starter Kit</Typography>
        <Alert sx={{ border: 1, padding: 2, mx: 2 }} severity='warning' >You user account has not been assigned to a tenant. You will
          not have access to ny reports until your user account has been assigned to a tenant.</Alert>
      </Container>
    )
  }

  if (embeddingData.workspaceArtifactsLoading) {
    return <DataLoading />
  }
  else {
    return (
      <Container maxWidth={false}>

        <Container maxWidth="xl">
          <Typography variant='h5' component="h2" sx={{ my: 3 }} >Welcome to the App-Owns-Data Starter Kit</Typography>

          <Alert sx={{ border: 1 }} severity='info' >
            Now that you have logged in, you can use the left navigation menu to navigate to the reports accessible within this tenant.
          </Alert>

          <Typography variant='h6' component="h4" sx={{ mt: 2, mb: "6px" }} >Login Session Info:</Typography>

          <TableContainer component={Paper} sx={{ border: 1, backgroundColor: "#EEEEEE" }} >
            <Table sx={{ minWidth: 650 }} aria-label="simple table" size="small" >
              <TableBody>
                <TableRow key={"username"} >
                  <TableCell scope="row" sx={{ width: "200px" }} >
                    User Login:
                  </TableCell>
                  <TableCell><strong>{account?.username}</strong></TableCell>
                </TableRow>
                <TableRow key={"name"} >
                  <TableCell scope="row" sx={{ width: "200px" }} >
                    User Display Name:
                  </TableCell>
                  <TableCell><strong>{account?.name}</strong></TableCell>
                </TableRow>
                <TableRow key={"tenant"} >
                  <TableCell scope="row" sx={{ width: "200px" }} >
                    Tenant Name:
                  </TableCell>
                  <TableCell><strong>{embeddingData.tenantName}</strong></TableCell>
                </TableRow>
                <TableRow key={"userCanEdit"} >
                  <TableCell scope="row">
                    User can edit content:
                  </TableCell>
                  <TableCell><strong>{String(embeddingData.userCanEdit)}</strong></TableCell>
                </TableRow>
                <TableRow key={"userCanCreate"} >
                  <TableCell scope="row">
                    User can create content:
                  </TableCell>
                  <TableCell><strong>{String(embeddingData.userCanCreate)}</strong></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant='h6' component="h4" sx={{ mt: 2, borderBottom: 1, mb: "8px" }} >Tenant Contents</Typography>

          <Grid container >
            <Grid item xs={6} sx={{ pr: "4px" }} >
              <Box sx={{ fontSize: "1.25rem", color: "white", background: "linear-gradient(to bottom, #607D8B, #455A64, #607D8B )", padding: "4px", paddingLeft: "12px", borderTopLeftRadius: "4px", borderTopRightRadius: "4px" }} >
                Reports
              </Box>
              <List sx={{ backgroundColor: "#EEEEEE", border: "1px solid #CCCCCC", pb: 0 }} >
                {embeddingData.reports &&
                  embeddingData.reports.map((report) => (
                    <ListItem key={report.id} divider dense >
                      <ListItemButton onClick={() => { navigate("/reports/" + report.id); }}>
                        <ListItemAvatar>
                          <Avatar sx={{ backgroundColor: "#607D8B" }} >
                            <Assessment />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText primary={report.name} />
                      </ListItemButton>
                    </ListItem>

                  ))}
              </List>
            </Grid>
            <Grid item xs={6} sx={{ pl: "4px" }}>
              <Box sx={{ fontSize: "1.25rem", color: "white", background: "linear-gradient(to bottom, #607D8B, #455A64, #607D8B )", padding: "4px", paddingLeft: "12px", borderTopLeftRadius: "4px", borderTopRightRadius: "4px" }} >
                Datasets
              </Box>
              <List sx={{ backgroundColor: "#EEEEEE", border: "1px solid #CCCCCC", pb: 0 }} >
                {embeddingData.datasets &&
                  embeddingData.datasets.map((dataset) => (
                    <ListItem key={dataset.id} divider dense >
                      <ListItemButton onClick={() => { navigate("/reports/" + dataset.id); }}>
                        <ListItemAvatar>
                          <Avatar sx={{ backgroundColor: "#607D8B" }} >
                            <Schema />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText primary={dataset.name} />
                      </ListItemButton>
                    </ListItem>
                  ))}
              </List>
            </Grid>
          </Grid>
        </Container>
      </Container>
    )
  };
}

export default Home;