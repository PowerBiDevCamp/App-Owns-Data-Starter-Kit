import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { SxProps } from '@mui/system/styleFunctionSx/styleFunctionSx';

interface ReportPathProps {
  reportPath: string;
  tokenExpiration: string;
  refreshEmbedToken: () => void;
}

const ReportPath = ({ reportPath, tokenExpiration, refreshEmbedToken }: ReportPathProps) => {

  const reportPathContainerProperties: SxProps = {
    width: 1,
    background: "linear-gradient(to bottom, #444444, #222222, #000000, #222222, #444444)",
    p: 0,
    m: 0,
    display: "flex",
    maxHeight: "36px"
  };

  const reportPathTextProperties: SxProps = {
    pl: "12px",
    pt: "8px",
    fontSize: "16px",
    color: 'white',
    minHeight: "36px",
    fontFamily: "arial"
  };

  const embedTokenTimeoutProps: SxProps = {
    mr: "16px",
    pt: "12px",
    fontSize: "10px",
    color: '#666666',
    fontFamily: "arial",
    ml: "auto",
    "&:hover": { color: "yellow", backgroundColor: "#666666" }
  };

  return (
    <Box sx={reportPathContainerProperties} >
      <Typography variant='h2' sx={reportPathTextProperties} >
        {reportPath}
      </Typography>
      <Button variant='text' onClick={refreshEmbedToken} sx={embedTokenTimeoutProps} >
        {tokenExpiration}
      </Button>
    </Box>
  )
}

export default ReportPath