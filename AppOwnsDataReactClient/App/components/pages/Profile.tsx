import React from 'react';
import { useMsal, useIsAuthenticated, useAccount } from "@azure/msal-react";

import PageNotAccessible from './../PageNotAccessible';

import { Container, Button, Paper, Typography, Divider } from '@mui/material';
import { Table, TableContainer, TableHead, TableBody, TableRow, TableCell } from '@mui/material';

const Profile = () => {
  const isAuthenticated = useIsAuthenticated();
  const { accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const [showTokenClaims, setShowTokenClaims] = React.useState(false);

  if (!isAuthenticated) {
    return <PageNotAccessible />;
  }
  else {
    return (
      <Container maxWidth="xl">
        <Typography variant='h5' component="h2" sx={{ my: 3 }} >User Profile</Typography>

        <TableContainer component={Paper}>
          <Table aria-label="simple table" sx={{ marginTop: "12px" }}>
            <TableHead sx={{ "& th": { color: "white", backgroundColor: "black" } }} >
              <TableRow>
                <TableCell>Profile Property</TableCell>
                <TableCell>Value</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow key={"name"}>
                <TableCell component="th" scope="row">name</TableCell>
                <TableCell>{account?.name}</TableCell>
              </TableRow>
              <TableRow key={"username"}>
                <TableCell component="th" scope="row">username</TableCell>
                <TableCell>{account?.username}</TableCell>
              </TableRow>
              <TableRow key={"localAccountId"}>
                <TableCell component="th" scope="row">localAccountId</TableCell>
                <TableCell>{account?.localAccountId}</TableCell>
              </TableRow>
              <TableRow key={"tenantId"}>
                <TableCell component="th" scope="row">tenantId</TableCell>
                <TableCell>{account?.tenantId}</TableCell>
              </TableRow>
              <TableRow key={"homeAccountId"}>
                <TableCell component="th" scope="row">homeAccountId</TableCell>
                <TableCell>{account?.homeAccountId}</TableCell>
              </TableRow>
              <TableRow key={"environment"}>
                <TableCell component="th" scope="row">environment</TableCell>
                <TableCell>{account?.environment}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        <Divider />

        <Button onClick={() => {
          setShowTokenClaims(!showTokenClaims);
        }} >
          {showTokenClaims ? "Hide Token Claims" : "Show Token Claims"}
        </Button>

        {showTokenClaims && (
          <>
            <Typography variant='h6' component="h3">Token Claims</Typography>
            <TableContainer component={Paper}>
              <Table aria-label="simple table" sx={{ marginTop: "12px" }}>
                <TableHead sx={{ "& th": { color: "white", backgroundColor: "black" } }} >
                  <TableRow>
                    <TableCell>Profile Property</TableCell>
                    <TableCell>Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.keys(account.idTokenClaims).map((key) => (
                    <TableRow key={key}>
                      <TableCell component="th" scope="row">{key}</TableCell>
                      <TableCell>{(account.idTokenClaims[key] as string)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Container>
    )
  }
}

export default Profile;