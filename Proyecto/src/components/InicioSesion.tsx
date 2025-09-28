import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const InicioSesion: React.FC = () => {
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const username = document.getElementById("username") as HTMLInputElement;
      const password = document.getElementById("password") as HTMLInputElement;

      fetch("http://localhost:4000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.value,
          password: password.value,
        }),
      })
        .then((response) => {
          if (!response.ok) throw new Error("Error en la autenticación");
          return response.json();
        })
        .then((data) => {
          console.log("Inicio de sesión exitoso:", data);
          navigate("/dashboard");
        })
        .catch((error) => {
          console.error("Error durante el inicio de sesión:", error);
        });
    } catch (error) {
      console.error("Error durante login:", error);
    }
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
    <div className="login-container">
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
        <div>
          <button type="submit">Iniciar Sesión</button>
        </div>
      </form>
      <nav>
        <button type="button" onClick={() => navigate("/recuperarcontra")}>
          ¿Olvidaste tu contraseña?
        </button>
      </nav>

      <button onClick={() => navigate("/register")}>Registrarse</button>
    </div>
  );
};

export default InicioSesion;
