import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const RecuperarContra: FC = () => {
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
      <header>
        <h1>Recuperar Contraseña</h1>

        <div className="progress-steps">
          {[
            "Identificación",
            "Verificación",
            "Nueva Contraseña",
            "Confirmación",
          ].map((step, index) => {
            const stepIndex = index;
            const faseIndex = [
              "identificacion",
              "verificacion",
              "nuevaPassword",
              "confirmacion",
            ].indexOf(fase);
            return (
              <div
                key={step}
                className={`step ${stepIndex <= faseIndex ? "active" : ""}`}
              >
                {step}
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
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              required
            >
              <option value="">Seleccione</option>
              <option value="email">Correo Electrónico</option>
              <option value="username">Nombre de Usuario</option>
            </select>

            {tipo === "email" && (
              <input
                type="email"
                placeholder="Correo Electrónico"
                value={valorValidacion}
                onChange={(e) => setValorValidacion(e.target.value)}
                required
              />
            )}
            {tipo === "username" && (
              <input
                type="text"
                placeholder="Usuario"
                value={valorValidacion}
                onChange={(e) => setValorValidacion(e.target.value)}
                required
              />
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
            <label>Ingrese token recibido:</label>
            <input
              type="text"
              value={tokenIngresado}
              onChange={(e) => setTokenIngresado(e.target.value)}
              required
            />
            <button type="submit">Validar Token</button>
          </form>
        </section>
      )}

      {/* Paso 3: Nueva contraseña */}
      {fase === "nuevaPassword" && (
        <section aria-label="Nueva Contraseña">
          <form onSubmit={handleCambiarPassword}>
            <input
              name="password"
              value={form.password}
              onChange={handleChange}
              type="password"
              placeholder="Nueva Contraseña"
              required
            />
            {errors.password && <p>{errors.password}</p>}

            <input
              name="confirmarPassword"
              value={form.confirmarPassword}
              onChange={handleChange}
              type="password"
              placeholder="Confirmar Contraseña"
              required
            />
            {errors.confirmarPassword && <p>{errors.confirmarPassword}</p>}

            <button type="submit">Cambiar Contraseña</button>
          </form>
        </section>
      )}

      {/* Paso 4: Confirmación */}
      {fase === "confirmacion" && (
        <section aria-label="Confirmación">
          <h2>Contraseña cambiada exitosamente</h2>
          <button onClick={() => navigate("/login")}>Ir a Login</button>
        </section>
      )}
    </main>
  );
};

export default RecuperarContra;
