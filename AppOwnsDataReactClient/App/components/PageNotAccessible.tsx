import React from 'react';
import { useIsAuthenticated } from "@azure/msal-react";
import { Container, Typography, Alert } from '@mui/material';

const PageNotAccessible = () => {
  const isAuthenticated = useIsAuthenticated();

  if (!isAuthenticated) {
    return (
      <Container maxWidth={false}>
        <Typography variant='h5' component="h2" sx={{ my: 3 }} >Page not accessible to anonymous user</Typography>
        <Alert sx={{ border:1, padding: 2, mx: 2 }} severity="error" >Please login by clicking the <strong>LOGIN</strong> link in the upper right of this page.</Alert>
      </Container>
    )
  }
}

export default PageNotAccessible;