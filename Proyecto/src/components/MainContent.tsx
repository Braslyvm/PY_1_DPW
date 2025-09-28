import React from "react";
interface MainContentProps {
  activeTab: string;
  extraComponent?: React.ReactNode;
}

const MainContent: React.FC<MainContentProps> = ({ activeTab, extraComponent }) => {
  return (
    <main style={{ flex: 1, backgroundColor: "#f80000ff" }}>
      {activeTab === "home" && <div><h2>Inicio del Dashboard</h2><p>Bienvenido a tu panel principal.</p></div>}
      {extraComponent}
    </main>
  );
};

export default MainContent;
