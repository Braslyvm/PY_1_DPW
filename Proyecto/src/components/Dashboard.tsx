import React, { useState } from "react";
import Header from "./Header";
import DetallesCuenta from "./DetallesCuenta";
import DetalleTarjeta from "./DetalleTarjeta";
import VerTarjetas from "./VerTarjetas";
import RegistroDeCuenta from "./registroDecuenta";
import ConsultarPIN from "./RecuperarPin";
import MainContent from "./MainContent";
import VerCuentas from "./verCuentas";
import Transferencias from "./Trasnferencias";
import SolicitudTarjeta from "./solicitarTargeta";

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState("cuentas");
  const [previousTab, setPreviousTab] = useState("cuentas");
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null
  );
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const username = localStorage.getItem("username"); 
  const handleSetActiveTab = (tab: string) => {
    setPreviousTab(activeTab);
    setActiveTab(tab);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header setActiveTab={handleSetActiveTab} />
      <MainContent
        activeTab={activeTab}
        extraComponent={
          <>
            {activeTab === "cuentas" && (
              <VerCuentas
                setActiveTab={handleSetActiveTab}
                setSelectedAccountId={setSelectedAccountId}
              />
            )}

            {activeTab === "detalleCuenta" && selectedAccountId && (
              <DetallesCuenta
                setActiveTab={handleSetActiveTab}
                accountId={selectedAccountId}
              />
            )}

            {activeTab === "tarjetas" && (
              <VerTarjetas
                setActiveTab={handleSetActiveTab}
                setSelectedCardId={setSelectedCardId}
              />
            )}

            {activeTab === "detalleTarjeta" && selectedCardId && (
              <DetalleTarjeta
                setActiveTab={handleSetActiveTab}
                cardId={selectedCardId}
              />
            )}

            {activeTab === "registroCuenta" && (
              <RegistroDeCuenta setActiveTab={() => setActiveTab(previousTab)} />
            )}

            {activeTab === "recuperarPin" && selectedCardId && (
              <ConsultarPIN
                setActiveTab={() => setActiveTab("detalleTarjeta")}
                cardId={selectedCardId}
              />
            )}

            {activeTab === "trasferencia" && username && (
              <Transferencias username={username as string} />
            )}

            {activeTab === "SolicitudTarjeta" && username && (
              <SolicitudTarjeta
                username={username as string}
                setActiveTab={handleSetActiveTab}
              />
            )}
          </>
        }
      />
    </div>
  );
};

export default Dashboard;
