import { useNavigate } from 'react-router-dom';

import AppBar from '@mui/material/AppBar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { SxProps } from '@mui/system/styleFunctionSx/styleFunctionSx';

import Apps from '@mui/icons-material/Apps';

import Login from './LoginMenu';

let appBarProps: SxProps = {
  zIndex: 2,
  height: "44px",
  p: 0,
  background: "linear-gradient(to bottom, #607D8B, #455A64, #607D8B )"
};

let appIconButtonProps: SxProps = {
  borderRadius: 0,
  m: 0,
  ml: "0px",
  pl: "4px",
  height: "42px",
  maxHeight: "42px"
};

let appIconImageProps: SxProps = {
  borderRadius: 0,
  ml: "4px",
  mr: "12px", width: "32px", height: "30px"
};

let appTitleProps: SxProps = {
  ml: 0,
  pt: "0px",
  fontSize: "20px"
};

const Banner = () => {
  let navigate = useNavigate();

  return (
    <AppBar position="relative" sx={appBarProps} >
      <Box sx={{ display: 'flex' }} >
        <IconButton onClick={() => { navigate("/") }} edge="start" color="inherit" aria-label="menu" sx={appIconButtonProps} >
          <Apps sx={appIconImageProps} />
          <Typography variant="h5" flexGrow={0} sx={appTitleProps} >App-Owns-Data React Client</Typography>
        </IconButton>
        <Login />
      </Box>
    </AppBar>
  )
}

export default Banner;