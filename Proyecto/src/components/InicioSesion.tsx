import React from "react";
import { useNavigate } from "react-router-dom";

const InicioSesion: React.FC = () => {
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/dashboard");
  };
  const mostrarcontraseña = () => {
    const passwordInput = document.getElementById(
      "password"
    ) as HTMLInputElement;
    if (passwordInput) {
      passwordInput.type =
        passwordInput.type === "password" ? "text" : "password";
    }
  };

  return (
    <div className="login-container" style={{ backgroundColor: "#7c7b7bff" }}>
      <h1>Inicio de Sesión</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">Usuario:</label>
          <input type="text" id="username" name="username" required />
        </div>
        <div>
          <label htmlFor="password">Contraseña:</label>
          <input type="password" id="password" name="password" required />
          <button type="button" onClick={mostrarcontraseña}>
            Mostrar Contraseña
          </button>
        </div>
      </form>

      <nav>
        <button type="submit">Iniciar Sesión</button>
        <br />
        <button onClick={() => navigate("/profile")}>
          ¿Olvidaste tu contraseña?
        </button>
      </nav>
      <button onClick={() => navigate("/register")}>Registrarse</button>
    </div>
  );
};

export default InicioSesion;
