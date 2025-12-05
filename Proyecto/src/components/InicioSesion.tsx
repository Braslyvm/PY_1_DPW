import React from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../config/Conectar"; 

const InicioSesion: React.FC = () => {
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const usernameInput = document.getElementById("username") as HTMLInputElement;
      const passwordInput = document.getElementById("password") as HTMLInputElement;
      const username = usernameInput.value;
      const password = passwordInput.value;
      apiFetch<{
        mensaje: string;
        token: string;
        rol: number;
        userId: string;
      }>("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      })
        .then((data) => {
          console.log("Inicio de sesión exitoso:", data);
          localStorage.setItem("token", data.token);
          localStorage.setItem("rol", String(data.rol));
          localStorage.setItem("userId", String(data.userId));
          localStorage.setItem("username", username);
          Swal.fire({
            icon: "success",
            title: "Bienvenido",
            text: data.mensaje,
            timer: 1500,
            showConfirmButton: false,
          });
          navigate("/dashboard");
        })
        .catch((error) => {
          console.error("Error durante el inicio de sesión:", error);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: error.message || "Usuario o contraseña incorrectos",
          });
        });
    } catch (error) {
      console.error("Error durante Login:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Ocurrió un error inesperado",
      });
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

        <h1>Banco NSFMS</h1>
        <p>Ingrese sus credenciales para acceder a su cuenta</p>

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
