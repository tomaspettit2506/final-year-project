import React from "react";
import { Box, Tab, useMediaQuery } from "@mui/material";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";

// Tutorial Components
import AppBarComponent from "../Components/AppBarComponent";
import BasicComponent from "../Components/TutorialComponents/BasicComponent";
import PiecesComponent from "../Components/TutorialComponents/PiecesComponent";
import RulesComponent from "../Components/TutorialComponents/RulesComponent";
import WinningComponent from "../Components/TutorialComponents/WinningComponent";
import DrawComponent from "../Components/TutorialComponents/DrawComponent";

function Tutorial() {
  const [value, setValue] = React.useState('basic');

  const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  // Mobile responsiveness
  const isMobile = useMediaQuery('(max-width:600px)');

  return (
    <>
      <AppBarComponent title="Chess Tutorial" isBackButton={true} isSettings={true}  isExit={true}/>
      <Box sx={{ width: isMobile ? '100%' : 'auto', typography: "body1", p: 3 }}>
        <TabContext value={value}>
          <Box sx={{ borderColor: "divider", display: "flex", justifyContent: "center" }}>
            <TabList onChange={handleChange} sx={{borderRadius: 15, bgcolor: 'background.paper', boxShadow: 3 }} variant="scrollable" scrollButtons="auto">
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
