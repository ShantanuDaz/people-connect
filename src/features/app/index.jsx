import { useState } from "react";
import Header from "./components/Header";
import Main from "./components/Main";

const AppLayout = () => {
  const [currentSection, setCurrentSection] = useState("messages");
  return (
    <div className="h-full grid grid-cols-[auto_1fr]">
      <Header onSectionChange={(section) => setCurrentSection(section)} />
      <Main currentSection={currentSection} />
    </div>
  );
};

export default AppLayout;
