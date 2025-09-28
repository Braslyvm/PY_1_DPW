import { useState } from "react";
import type { FC } from "react";
import { useNavigate } from "react-router-dom";

// Regex para validaciones
const usernameRegex = /^[a-z0-9._-]{4,20}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const nacionalRegex = /^\d-\d{4}-\d{4}$/;
const dimexRegex = /^\d{11,12}$/;
const pasaporteRegex = /^[A-Z0-9]{6,12}$/;
const telefonoRegex = /^\+506 \d{4}-\d{4}$/;

const Registro: FC = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    tipoDocumento: "",
    numeroDocumento: "",
    username: "",
    nombreCompleto: "",
    fechaNacimiento: "",
    correo: "",
    telefono: "",
    password: "",
    confirmarPassword: "",
    aceptarTerminos: false,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [showTerminos, setShowTerminos] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!form.tipoDocumento)
      newErrors.tipoDocumento = "Seleccione tipo de documento.";

    if (
      form.tipoDocumento === "Nacional" &&
      !nacionalRegex.test(form.numeroDocumento)
    )
      newErrors.numeroDocumento =
        "Formato inválido para Nacional (#-####-####).";
    if (
      form.tipoDocumento === "DIMEX" &&
      !dimexRegex.test(form.numeroDocumento)
    )
      newErrors.numeroDocumento = "DIMEX debe tener 11–12 dígitos.";
    if (
      form.tipoDocumento === "Pasaporte" &&
      !pasaporteRegex.test(form.numeroDocumento)
    )
      newErrors.numeroDocumento =
        "Pasaporte debe tener 6–12 caracteres alfanuméricos en mayúscula.";

    if (!usernameRegex.test(form.username))
      newErrors.username =
        "Username inválido. 4–20 caracteres, minúsculas, números, ._- permitidos.";

    if (!form.fechaNacimiento) {
      newErrors.fechaNacimiento = "Ingrese su fecha de nacimiento.";
    } else {
      const hoy = new Date();
      const nacimiento = new Date(form.fechaNacimiento);
      const edad = hoy.getFullYear() - nacimiento.getFullYear();
      if (
        edad < 18 ||
        (edad === 18 &&
          hoy < new Date(nacimiento.setFullYear(nacimiento.getFullYear() + 18)))
      )
        newErrors.fechaNacimiento = "Debe ser mayor de 18 años.";
    }

    if (!emailRegex.test(form.correo)) newErrors.correo = "Correo no válido.";

    if (form.telefono && !telefonoRegex.test(form.telefono))
      newErrors.telefono = "Teléfono inválido. Formato: +506 ####-####";

    if (!passwordRegex.test(form.password))
      newErrors.password =
        "Contraseña debe tener mínimo 8 caracteres, 1 mayúscula, 1 minúscula y 1 dígito.";

    if (form.password !== form.confirmarPassword)
      newErrors.confirmarPassword = "Las contraseñas no coinciden.";

    if (!form.aceptarTerminos)
      newErrors.aceptarTerminos = "Debe aceptar los términos y condiciones.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const response = await fetch("http://localhost:4000/api/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      alert(data.mensaje);
      setLoading(false);
      navigate("/login");
    } catch (error) {
      console.error(error);
      alert("Error al registrar usuario");
      setLoading(false);
    }
    navigate("/dashboard");
  };

  return (
    <div>
      <header>
        {" "}
        <h1>Registro de Usuario</h1>
      </header>
      <main>
        <form onSubmit={handleSubmit} id="registroForm">
          <input
            name="nombreCompleto"
            value={form.nombreCompleto}
            onChange={handleChange}
            type="text"
            placeholder="Nombre completo"
            required
            tabIndex={1}
          />
          {errors.nombreCompleto && <p>{errors.nombreCompleto}</p>}

          <input
            name="username"
            value={form.username}
            onChange={handleChange}
            onBlur={() => {}}
            type="text"
            placeholder="Username"
            required
            tabIndex={2}
          />
          {errors.username && <p>{errors.username}</p>}

          <select
            name="tipoDocumento"
            value={form.tipoDocumento}
            onChange={handleChange}
            required
          >
            <option value="">Seleccione tipo de documento</option>
            <option value="Nacional">Nacional</option>
            <option value="DIMEX">DIMEX</option>
            <option value="Pasaporte">Pasaporte</option>
          </select>
          {errors.tipoDocumento && <p>{errors.tipoDocumento}</p>}

          <input
            tabIndex={3}
            name="numeroDocumento"
            value={form.numeroDocumento}
            onChange={handleChange}
            type="text"
            placeholder="Número de documento"
            required
          />
          {errors.numeroDocumento && <p>{errors.numeroDocumento}</p>}

          <input
            name="fechaNacimiento"
            value={form.fechaNacimiento}
            onChange={handleChange}
            type="date"
            required
            tabIndex={4}
          />
          {errors.fechaNacimiento && <p>{errors.fechaNacimiento}</p>}

          <input
            name="correo"
            value={form.correo}
            onChange={handleChange}
            type="email"
            placeholder="Correo Electrónico"
            required
            tabIndex={5}
          />
          {errors.correo && <p>{errors.correo}</p>}

          <input
            name="telefono"
            value={form.telefono}
            onChange={handleChange}
            type="text"
            placeholder="Teléfono (+506 ####-####)"
            required
            tabIndex={6}
          />
          {errors.telefono && <p>{errors.telefono}</p>}

          <input
            name="password"
            value={form.password}
            onChange={handleChange}
            type="password"
            placeholder="Contraseña"
            required
            tabIndex={7}
          />
          {errors.password && <p>{errors.password}</p>}

          <input
            name="confirmarPassword"
            value={form.confirmarPassword}
            onChange={handleChange}
            type="password"
            placeholder="Confirmar contraseña"
            required
            tabIndex={8}
          />
          {errors.confirmarPassword && <p>{errors.confirmarPassword}</p>}

          <section>
            <input
              name="aceptarTerminos"
              checked={form.aceptarTerminos}
              onChange={handleChange}
              type="checkbox"
              id="terminos"
            />
            <label htmlFor="terminos">
              Acepto los{" "}
              <button
                type="button"
                onClick={() => setShowTerminos(!showTerminos)}
              >
                {showTerminos
                  ? "Cerrr Términos y Condiciones"
                  : "Términos y Condiciones"}
              </button>
            </label>
            {errors.aceptarTerminos && <p>{errors.aceptarTerminos}</p>}
          </section>

          <button type="submit" disabled={loading || !form.aceptarTerminos}>
            {loading ? "Registrando..." : "Registrar"}
          </button>
        </form>

        {showTerminos && (
          <section>
            <h2>Términos y Condiciones</h2>
            <embed
              src="/TerminosyCondiciones.pdf"
              type="application/pdf"
              width="100%"
              height="400px"
            />
          </section>
        )}
        <button type="button" onClick={() => navigate("/login")}>
          volver
        </button>
      </main>
    </div>
  );
};

export default Registro;
