import React from "react";
import { Box, Tab, useMediaQuery } from "@mui/material";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import { useTheme } from "../Context/ThemeContext";
import ChessGalaxyTheme from "../assets//img-theme/chess_galaxy.jpg";

// Tutorial Components
import AppBar from "../Components/AppBar";
import Basic from "../Components/TutorialComponents/Basic";
import Pieces from "../Components/TutorialComponents/Pieces";
import Rules from "../Components/TutorialComponents/Rules";
import Winning from "../Components/TutorialComponents/Winning";
import Draw from "../Components/TutorialComponents/Draw";

function Tutorial() {
  const { isDark } = useTheme();
  const [value, setValue] = React.useState('basic');
  const tabListRef = React.useRef<HTMLDivElement>(null);
  const touchStartX = React.useRef(0);

  const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  // Handle horizontal scroll on mobile via swipe/drag
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!tabListRef.current) return;
    
    const touchCurrentX = e.touches[0].clientX;
    const diff = touchStartX.current - touchCurrentX;
    
    // Scroll the tab list horizontally
    tabListRef.current.scrollLeft += diff;
    touchStartX.current = touchCurrentX;
  };

  // Mobile responsiveness
  const isMobile = useMediaQuery('(max-width:600px)');

  return (
    <>
      <AppBar isBackButton={false} isSettings={true}  isExit={true}/>
      <Box sx={{ width: isMobile ? '100%' : 'auto', typography: "body1", p: 3, backgroundImage: `url(${ChessGalaxyTheme})`, backgroundSize: 'cover', borderRadius: 2 }}>
        <TabContext value={value}>
          <Box sx={{ borderColor: "divider", display: "flex", justifyContent: "center" }}>
            <TabList
              ref={tabListRef}
              onChange={handleChange}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              sx={{
                width: isMobile ? '100%' : 'auto',
                minWidth: isMobile ? 'auto' : '550px',
                bgcolor: isDark ? '#1E293Bad' : '#E0F2FEad',
                borderRadius: 15,
                overflowX: 'auto',
                overflowY: 'hidden',
                scrollBehavior: 'smooth',
                '&::-webkit-scrollbar': {
                  height: '4px',
                },
                '&::-webkit-scrollbar-track': {
                  background: isDark ? '#0F172A' : '#F0F9FF',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: isDark ? '#475569' : '#CBD5E1',
                  borderRadius: '4px',
                },
                '& .MuiTab-root': {
                  color: isDark ? '#7DD3FC' : '#1D4ED8',
                  fontSize: isMobile ? '0.75rem' : '1.05rem',
                  textTransform: 'none',
                  padding: isMobile ? '8px 4px' : '12px 16px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                },
                '& .MuiTab-root.Mui-selected': {
                  color: isDark ? '#E0F2FE' : '#0B5FFF',
                  fontWeight: 700,
                },
                '& .MuiTab-root .MuiTab-iconWrapper': {
                  fontSize: isMobile ? '0.9rem' : '1.1rem',
                  marginRight: isMobile ? '4px' : '8px',
                },
              }}
              variant="scrollable"
              scrollButtons="auto"
              aria-label="tutorial tabs"
            >
              {/* Each Tab representing a tutorial section with Icon*/}
              <Tab icon={"📖"} iconPosition="start" label="Basic" value="basic" className="icon-button" />
              <Tab icon={"⚔️"} iconPosition="start" label="Pieces" value="pieces" className="icon-button" />
              <Tab icon={"🤝"} iconPosition="start" label="Rules" value="rules" className="icon-button" />
              <Tab icon={"👑"} iconPosition="start" label="Winning" value="winning" className="icon-button" />
              <Tab icon={"🏆"} iconPosition="start" label="Draw" value="draw" className="icon-button" />
            </TabList>
          </Box>

          <TabPanel value="basic">
            <Basic />
          </TabPanel>

          <TabPanel value="pieces">
            <Pieces />
          </TabPanel>

          <TabPanel value="rules">
            <Rules />
          </TabPanel>
          
          <TabPanel value="winning">
            <Winning />
          </TabPanel>

          <TabPanel value="draw">
            <Draw />
          </TabPanel>
        </TabContext>
      </Box>
    </>
  );
}

export default Tutorial;
