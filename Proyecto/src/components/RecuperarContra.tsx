import React, { useState, type FC } from "react";
import { useNavigate } from "react-router-dom";

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const RecuperarContra: FC = () => {
  const navigate = useNavigate();

  const [tipo, setTipo] = useState("");
  const [valorValidacion, setValorValidacion] = useState("");
  const [tokenGenerado, setTokenGenerado] = useState("");
  const [tokenIngresado, setTokenIngresado] = useState("");
  const [fase, setFase] = useState<"validacion" | "cambiarPassword">(
    "validacion"
  );
  const [form, setForm] = useState({ password: "", confirmarPassword: "" });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const validate = () => {
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

  const handleEnviarToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valorValidacion) return alert("Ingrese correo o usuario.");
    setTokenGenerado("0000");
    alert(`Token enviado al usuario: ${"0000"}`);
    setFase("cambiarPassword");
    setLoading(false);
  };

  const handleCambiarPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (tokenIngresado !== tokenGenerado)
      return alert("Token incorrecto, intente de nuevo.");

    if (!validate()) return;

    alert("Contraseña cambiada exitosamente.");
    navigate("/login");
  };

  return (
    <main className="login-container">
      <h1>Recuperar Contraseña</h1>

      {fase === "validacion" && (
        <section aria-label="Validación de usuario">
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

      {fase === "cambiarPassword" && (
        <section aria-label="Cambio de contraseña">
          <form onSubmit={handleCambiarPassword} id="registroForm">
            <label>Ingrese token recibido:</label>
            <input
              type="text"
              value={tokenIngresado}
              onChange={(e) => setTokenIngresado(e.target.value)}
              required
            />

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
    </main>
  );
};

export default RecuperarContra;
