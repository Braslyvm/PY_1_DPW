import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import InicioSesion from "./components/InicioSesion";
import Registro from "./components/Registro";
import RecuperarContra from "./components/RecuperarContra";

// Componentes temporales - puedes crear archivos separados después
const Dashboard = () => (
  <div>
    <h1>Dashboard</h1>
    <p>Bienvenido al dashboard!</p>
    <nav></nav>
  </div>
);

const AppRouter: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<InicioSesion />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/recuperarcontra" element={<RecuperarContra />} />

        <Route path="/register" element={<Registro />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
