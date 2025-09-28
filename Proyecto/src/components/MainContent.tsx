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
      {activeTab === "home" && (
        <div>
          <h2>Inicio del Dashboard</h2>
          <p>Bienvenido a tu panel principal.</p>
        </div>
      )}
      {extraComponent}
    </main>
  );
};

export default MainContent;
