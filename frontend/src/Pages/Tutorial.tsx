// Tutorial.tsx

import React from "react";
import { Box, Tab } from "@mui/material";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import { Crown, Trophy, Handshake, BookOpen, Swords} from 'lucide-react';

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

  return (
    <>
      <AppBarComponent title="Chess Tutorial" isBackButton={true} isSettings={true}  isExit={true}/>
      <Box sx={{ width: "100%", typography: "body1", p: 3 }}>
        <TabContext value={value}>
          <Box sx={{ borderColor: "divider", display: "flex", justifyContent: "center"}}>
            <TabList onChange={handleChange} sx={{borderRadius: 15, bgcolor: 'background.paper', boxShadow: 3 }} variant="scrollable" scrollButtons="auto">
              {/* Each Tab representing a tutorial section with Icon*/}
              <Tab icon={<BookOpen />} iconPosition="start" label="Basic" value="basic" />
              <Tab icon={<Swords />} iconPosition="start" label="Pieces" value="pieces" />
              <Tab icon={<Handshake />} iconPosition="start" label="Rules" value="rules" />
              <Tab icon={<Crown />} iconPosition="start" label="Winning" value="winning" />
              <Tab icon={<Trophy />} iconPosition="start" label="Draw" value="draw" />
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
