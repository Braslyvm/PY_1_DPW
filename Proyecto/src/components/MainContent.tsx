import React from "react";
interface MainContentProps {
  activeTab: string;
  extraComponent?: React.ReactNode;
}

const MainContent: React.FC<MainContentProps> = ({
  activeTab,
  extraComponent,
}) => {
  return (
    <main>
      {extraComponent}
    </main>
  );
};

export default MainContent;
