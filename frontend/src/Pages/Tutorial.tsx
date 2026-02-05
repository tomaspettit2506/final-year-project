import React from "react";
import { Box, Tab, useMediaQuery } from "@mui/material";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import { useTheme } from "../Context/ThemeContext";
import ChessGalaxyTheme from "../assets/chess_galaxy.jpg";

// Tutorial Components
import AppBarComponent from "../Components/AppBarComponent";
import BasicComponent from "../Components/TutorialComponents/BasicComponent";
import PiecesComponent from "../Components/TutorialComponents/PiecesComponent";
import RulesComponent from "../Components/TutorialComponents/RulesComponent";
import WinningComponent from "../Components/TutorialComponents/WinningComponent";
import DrawComponent from "../Components/TutorialComponents/DrawComponent";

function Tutorial() {
  const { isDark } = useTheme();
  const [value, setValue] = React.useState('basic');

  const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  // Mobile responsiveness
  const isMobile = useMediaQuery('(max-width:600px)');

  return (
    <>
      <AppBarComponent title="Chess Tutorial" isBackButton={true} isSettings={true}  isExit={true}/>
      <Box sx={{ width: isMobile ? '100%' : 'auto', typography: "body1", p: 3, backgroundImage: `url(${ChessGalaxyTheme})`, backgroundSize: 'cover', borderRadius: 2 }}>
        <TabContext value={value}>
          <Box sx={{ borderColor: "divider", display: "flex", justifyContent: "center" }}>
            <TabList
              onChange={handleChange}
              sx={{
                width: isMobile ? '100%' : '75%',
                minWidth: isMobile ? 'auto' : '550px',
                bgcolor: isDark ? '#1E293B' : '#E0F2FE',
                borderRadius: 15,
                '& .MuiTab-root': {
                  color: isDark ? '#7DD3FC' : '#1D4ED8',
                  fontSize: isMobile ? '0.75rem' : '1.05rem',
                  textTransform: 'none',
                  padding: isMobile ? '8px 4px' : '12px 16px',
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
              variant="fullWidth"
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
            <BasicComponent />
          </TabPanel>

          <TabPanel value="pieces">
            <PiecesComponent />
          </TabPanel>

          <TabPanel value="rules">
            <RulesComponent />
          </TabPanel>
          
          <TabPanel value="winning">
            <WinningComponent />
          </TabPanel>

          <TabPanel value="draw">
            <DrawComponent />
          </TabPanel>
        </TabContext>
      </Box>
    </>
  );
}

export default Tutorial;
