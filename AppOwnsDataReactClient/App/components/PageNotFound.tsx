import { useNavigate } from 'react-router-dom';

import { Container, Button, Typography, Alert } from '@mui/material';

const PageNotFound = () => {
    const navigate = useNavigate();

    return (
        <Container maxWidth={false}>
            <Typography variant='h5' component="h2" sx={{my:3}} >The request page cannot be found</Typography>
            <Alert sx={{ border:1, padding: 2, mx: 2 }} severity="error"> The following URL is not valid: <strong>{document.URL}</strong></Alert>
            <Button onClick={() => { navigate("/"); }} sx={{mt:3}} >
                Go to home page
            </Button>
        </Container>
    )
};

export default PageNotFound;

