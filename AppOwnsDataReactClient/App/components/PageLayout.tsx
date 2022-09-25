import { Route, Routes } from "react-router-dom";

import Banner from './Banner';
import LeftNav from './LeftNav';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Report from './pages/Report';
import PageNotFound from './PageNotFound';

import { Box } from '@mui/material';

const PageLayout = () => {

    return (
        <Box>
            <Banner />
            <Box sx={{ display: "flex" }} >
                <LeftNav />
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="reports/:id" element={<Report />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="*" element={<PageNotFound />} />
                </Routes>
            </Box>
        </Box>
    )
}

export default PageLayout