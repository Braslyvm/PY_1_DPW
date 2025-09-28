import React, { useState } from "react";
import Header from "./Header";
import HelloWorld from "./algo";
import DetallesCuenta from "./DetallesCuenta";
import MainContent from './MainContent';
import VerCuentas from './verCuentas';



const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null
  );

  return (
    <div
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      <Header setActiveTab={setActiveTab} />
      <MainContent
        activeTab={activeTab}
        extraComponent={
          <>
            {activeTab === "hello" && <HelloWorld />}
            {activeTab === "cuentas" && (
              <VerCuentas
                setActiveTab={setActiveTab}
                setSelectedAccountId={setSelectedAccountId}
              />
            )}
            {activeTab === "detalleCuenta" && selectedAccountId && (
              <DetallesCuenta
                setActiveTab={setActiveTab}
                accountId={selectedAccountId}
              />
            )}
          </>
        }
      />
    </div>
  );
};

export default Dashboard;
