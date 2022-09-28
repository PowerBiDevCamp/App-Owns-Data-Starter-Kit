import { useLayoutEffect, useRef } from 'react';

import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress'
import { SxProps } from '@mui/system/styleFunctionSx/styleFunctionSx';

const DataLoading = () => {
  let topContaner = useRef();
  let userMessge = useRef();
  let progressIndicator = useRef();

  let topContainerProps: SxProps = { width: 1, backgroundColor: "#F4D03F", textAlign: "center", p: 3 };

  let userMessgeProps: SxProps = { m: 2, color: "Black", fontSize: "24px" };

  let progressIndicatorProps: SxProps = { mt: "18px", color: "Black" };

  useLayoutEffect(() => {
    var container: HTMLElement = topContaner.current;
    container.style.height = (window.innerHeight - 50) + "px";
    var indicator: HTMLElement = progressIndicator.current;
  });

  return (
    <Box ref={topContaner} sx={topContainerProps} >
      <Typography variant='subtitle1' ref={userMessge} sx={userMessgeProps} >Waiting for data to load...</Typography>
      <CircularProgress ref={progressIndicator} size="3rem" sx={progressIndicatorProps} />
    </Box>
  );

}

export default DataLoading;