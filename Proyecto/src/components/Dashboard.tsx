import React, { useState } from "react";
import Header from "./Header";
import MainContent from "./Maincontent";
import HelloWorld from "./algo";
import VerCuentas from "./VerCuentas";
import DetallesCuenta from "./DetallesCuenta";
import DetalleTarjeta from "./DetalleTarjeta";
import VerTarjetas from "./VerTarjetas";
import RegistroDeCuenta from "./registroDecuenta";

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [previousTab, setPreviousTab] = useState("home"); // Para recordar la pestaña anterior
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null
  );
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // Función para cambiar pestaña y recordar la anterior
  const handleSetActiveTab = (tab: string) => {
    setPreviousTab(activeTab);
    setActiveTab(tab);
  };

  return (
    <div
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      <Header setActiveTab={handleSetActiveTab} />
      <MainContent
        activeTab={activeTab}
        extraComponent={
          <>
            {activeTab === "hello" && <HelloWorld />}
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
              <RegistroDeCuenta
                setActiveTab={() => setActiveTab(previousTab)} // Cancelar vuelve a la pestaña anterior
              />
            )}
          </>
        }
      />
    </div>
  );
};

export default Dashboard;
