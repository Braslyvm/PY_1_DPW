import React from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

const InicioSesion: React.FC = () => {
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const username = document.getElementById("username") as HTMLInputElement;
      const password = document.getElementById("password") as HTMLInputElement;

      fetch("https://py1dpw-production.up.railway.app/api/login", {
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
          // Guardar username en localStorage
          localStorage.setItem("username", data.user.username);
          navigate("/dashboard");
        })
        .catch((error) => {
          console.error("Error durante el inicio de sesión:", error);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Usuario o contraseña incorrectos",
          });
        });
    } catch (error) {
      console.error("Error durante Login:", error);
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
      <form onSubmit={handleSubmit}>
        {/* Logo/Icono superior */}
        <div style={{ textAlign: "center", marginBottom: "1rem" }}>
          <i
            className="fas fa-shield-alt"
            style={{
              fontSize: "2.5rem",
              color: "var(--accent)",
              background: "var(--light-bg)",
              padding: "1rem",
              borderRadius: "50%",
            }}
          ></i>
        </div>

        {/* Título */}
        <h1>Banco NSFMS</h1>
        <p>Ingrese sus credenciales para acceder a su cuenta</p>

        {/* Usuario */}
        <div className="form-group">
          <label htmlFor="username">Usuario</label>

          <div className="input-wrapper">
            <i className="fas fa-envelope"></i>
            <input
              type="text"
              id="username"
              name="username"
              placeholder="Usuario"
              required
            />
          </div>
        </div>

        {/* Contraseña */}
        <div className="form-group">
          <label htmlFor="password">Contraseña</label>
          <div className="input-wrapper">
            <i className="fas fa-lock"></i>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Ingrese su contraseña"
              required
            />
            <button
              type="button"
              className="toggle-password"
              onClick={mostrarcontraseña}
            >
              <i className="fas fa-eye"></i>
            </button>
          </div>
        </div>
        <button type="submit">Iniciar Sesión</button>

        {/* Navegación */}
        <nav>
          <button type="button" onClick={() => navigate("/recuperar-contra")}>
            ¿Olvidaste tu contraseña?
          </button>

          <button type="button" onClick={() => navigate("/register")}>
            ¿No tienes una cuenta? <strong>Registrarse</strong>
          </button>
        </nav>
      </form>
    </div>
  );
};

export default InicioSesion;
