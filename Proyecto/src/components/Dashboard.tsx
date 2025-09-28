import React, { useState } from "react";
import Header from "./Header";
import MainContent from "./Maincontent";
import HelloWorld from "./algo"; // <-- importa tu archivo algo.tsx

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState("home");

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header setActiveTab={setActiveTab} />
      <MainContent activeTab={activeTab} extraComponent={activeTab === "hello" ? <HelloWorld /> : null} />
    </div>
  );
};

export default Dashboard;
