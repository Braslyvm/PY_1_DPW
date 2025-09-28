import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import "../style/barraProgreso.css";

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const RecuperarContra: React.FC = () => {
  const navigate = useNavigate();
  const MySwal = withReactContent(Swal);

  // Estados
  const [tipo, setTipo] = useState("");
  const [valorValidacion, setValorValidacion] = useState("");
  const [tokenGenerado, setTokenGenerado] = useState("");
  const [tokenIngresado, setTokenIngresado] = useState("");
  const [fase, setFase] = useState<
    "identificacion" | "verificacion" | "nuevaPassword" | "confirmacion"
  >("identificacion");
  const [form, setForm] = useState({ password: "", confirmarPassword: "" });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  // Manejo de inputs
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // Validación de contraseña
  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (!passwordRegex.test(form.password)) {
      newErrors.password =
        "Contraseña debe tener mínimo 8 caracteres, 1 mayúscula, 1 minúscula y 1 dígito.";
    }
    if (form.password !== form.confirmarPassword) {
      newErrors.confirmarPassword = "Las contraseñas no coinciden.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Enviar token (simulado)
  const handleEnviarToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valorValidacion) return alert("Ingrese correo o usuario.");
    setTokenGenerado("0000"); // simulación de token
    setFase("verificacion");
    setLoading(true);
    alert(`Token enviado al usuario: 0000`);
  };

  // Validar token
  const handleValidarToken = (e: React.FormEvent) => {
    setLoading(false);
    e.preventDefault();
    if (tokenIngresado === tokenGenerado) {
      setFase("nuevaPassword");
    } else {
      alert("Token incorrecto, intente de nuevo.");
    }
  };

  // Cambiar contraseña
  const handleCambiarPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    MySwal.fire("¡Hecho!", "Contraseña cambiada con éxito", "success").then(
      () => {
        setFase("confirmacion");
      }
    );
  };

  return (
    <main className="login-container">
      <header className="encabezado-recuperacion">
        <h1 className="titulo-recuperacion">Recuperar Contraseña</h1>
        <div className="progress-container">
          {["Identificación", "Verificación", "Nueva Contraseña", "Confirmación"].map((step, index) => {
            const faseIndex = ["identificacion", "verificacion", "nuevaPassword", "confirmacion"].indexOf(fase);
            return (
              <div key={step} className="step-item">
                <div className={`step-circle ${index <= faseIndex ? "active" : ""}`}>
                  {index + 1}
                </div>
                <div className="step-label">{step}</div>
              </div>
            );
          })}
        </div>
      </header>

      {/* Paso 1: Identificación */}
      {fase === "identificacion" && (
        <section aria-label="Identificación">
          <form onSubmit={handleEnviarToken}>
            <label htmlFor="tipo">Validar por:</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)} required>
              <option value="">Seleccione</option>
              <option value="email">Correo Electrónico</option>
              <option value="username">Nombre de Usuario</option>
            </select>

            {tipo === "email" && (
              <div className="input-wrapper">
                <i className="fas fa-envelope"></i>
                <input
                  type="email"
                  placeholder="Correo Electrónico"
                  value={valorValidacion}
                  onChange={(e) => setValorValidacion(e.target.value)}
                  required
                />
              </div>
            )}

            {tipo === "username" && (
              <div className="input-wrapper">
                <i className="fas fa-user"></i>
                <input
                  type="text"
                  placeholder="Usuario"
                  value={valorValidacion}
                  onChange={(e) => setValorValidacion(e.target.value)}
                  required
                />
              </div>
            )}

            <button type="submit" disabled={loading}>
              {loading ? "Enviando..." : "Enviar Token"}
            </button>
          </form>
        </section>
      )}

      {/* Paso 2: Verificación */}
      {fase === "verificacion" && (
        <section aria-label="Verificación">
          <form onSubmit={handleValidarToken}>
            <div className="input-wrapper">
              <i className="fas fa-key"></i>
              <input
                type="text"
                placeholder="Ingrese token recibido"
                value={tokenIngresado}
                onChange={(e) => setTokenIngresado(e.target.value)}
                required
              />
            </div>
            <button type="submit">Validar Token</button>

            <button
              type="submit"
              className="link-btn"
              onClick={() => {
                setTokenGenerado("0000");
                alert("Código reenviado al usuario: 0000");
              }}
            >
              Reenviar Código
            </button>
          </form>
        </section>
      )}

      {/* Paso 3: Nueva Contraseña */}
      {fase === "nuevaPassword" && (
        <section aria-label="Nueva Contraseña">
          <form onSubmit={handleCambiarPassword}>
            <p className="hint">
              Debe tener mínimo 8 caracteres, 1 mayúscula, 1 minúscula y 1 dígito.
            </p>
            <div className="input-wrapper">
              <i className="fas fa-lock"></i>
              <input
                name="password"
                value={form.password}
                onChange={handleChange}
                type="password"
                placeholder="Nueva Contraseña"
                required
              />
            </div>
            <div className="input-wrapper">
              <i className="fas fa-lock"></i>
              <input
                name="confirmarPassword"
                value={form.confirmarPassword}
                onChange={handleChange}
                type="password"
                placeholder="Confirmar Contraseña"
                required
              />
            </div>
            {errors.confirmarPassword && <p className="error">{errors.confirmarPassword}</p>}

            <nav>
              <button type="submit">Cambiar Contraseña</button>
            </nav>
          </form>
        </section>
      )}

      {/* Paso 4: Confirmación */}
      {fase === "confirmacion" && (
        <section aria-label="Confirmación" className="success">
          <h2>✅ Contraseña cambiada exitosamente</h2>
          <button onClick={() => navigate("/login")}>Ir a Login</button>
        </section>
      )}

        <nav>
          <button type="button" onClick={() => navigate("/login")}>
            Volver al login: <strong>volver</strong>
          </button>
        </nav>
    </main>
  );

};

export default RecuperarContra;
