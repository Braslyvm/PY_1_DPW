import { useState } from "react";
import type { FC } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { apiFetch } from "../config/Conectar";

const usernameRegex = /^[a-z0-9._-]{4,20}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const dimexRegex = /^\d{11,12}$/;
const pasaporteRegex = /^[A-Z0-9]{6,12}$/;

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
    const target = e.target as HTMLInputElement;
    const { name, value, type, checked } = target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!form.tipoDocumento)
      newErrors.tipoDocumento = "Seleccione tipo de documento.";

    if (
      form.tipoDocumento === "DIMEX" &&
      !dimexRegex.test(form.numeroDocumento)
    )
      newErrors.numeroDocumento = "DIMEX debe tener 11–12 dígitos.";
    if (
      form.tipoDocumento === "Pasaporte" &&
      !pasaporteRegex.test(form.numeroDocumento)
    )
    if (!form.nombreCompleto.trim())
      newErrors.nombreCompleto = "Ingrese su nombre completo.";

    if (!form.fechaNacimiento) {
      newErrors.fechaNacimiento = "Ingrese su fecha de nacimiento.";
    } else {
      const hoy = new Date();
      const nacimiento = new Date(form.fechaNacimiento);
      const edad = hoy.getFullYear() - nacimiento.getFullYear();
      const cumple18 = new Date(
        nacimiento.getFullYear() + 18,
        nacimiento.getMonth(),
        nacimiento.getDate()
      );
      if (hoy < cumple18)
        newErrors.fechaNacimiento = "Debe ser mayor de 18 años.";
    }
    if (!emailRegex.test(form.correo)) newErrors.correo = "Correo no válido.";

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

  const mapTipoDocumento = (tipo: string): number => {
    switch (tipo) {
      case "Nacional":
        return 1;
      case "DIMEX":
        return 2;
      case "Pasaporte":
        return 3;
      default:
        return 0;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    try {
      const partesNombre = form.nombreCompleto.trim().split(/\s+/);
      const nombre = partesNombre[0] || "";
      const apellido1 = partesNombre[1] || "";
      const apellido2 =
        partesNombre.length > 2
          ? partesNombre.slice(2).join(" ")
          : "";

      const tipo_identificacion = mapTipoDocumento(form.tipoDocumento);

      const body = {
        numero_documento: form.numeroDocumento,
        tipo_identificacion,
        nombre,
        apellido1,
        apellido2,
        username: form.username,
        fecha_nacimiento: form.fechaNacimiento,
        correo: form.correo,
        telefono: form.telefono,
        contrasena: form.password,
        rol: 2, 
      };

      await apiFetch("/api/v1/users", {
        method: "POST",
        body: JSON.stringify(body),
      });

      Swal.fire({
        icon: "success",
        title: "Registro exitoso",
        text: "Su usuario ha sido creado. Ahora puede iniciar sesión.",
      });

      setLoading(false);
      navigate("/login");
    } catch (error: any) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Error al registrar usuario",
        text: error.message || "No se pudo completar el registro.",
      });
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h1>Registro de Usuario</h1>
      <form onSubmit={handleSubmit}>
        <input
          className="input-wrapper"
          name="nombreCompleto"
          value={form.nombreCompleto}
          onChange={handleChange}
          type="text"
          placeholder="Nombre completo"
          required
        />
        {errors.nombreCompleto && <p>{errors.nombreCompleto}</p>}

        <input
          className="input-wrapper"
          name="username"
          value={form.username}
          onChange={handleChange}
          type="text"
          placeholder="Username"
          required
        />
        {errors.username && <p>{errors.username}</p>}

        <select
          className="input-wrapper"
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
          className="input-wrapper"
          name="numeroDocumento"
          value={form.numeroDocumento}
          onChange={handleChange}
          type="text"
          placeholder="Número de documento"
          required
        />
        {errors.numeroDocumento && <p>{errors.numeroDocumento}</p>}

        <input
          className="input-wrapper"
          name="fechaNacimiento"
          value={form.fechaNacimiento}
          onChange={handleChange}
          type="date"
          required
        />
        {errors.fechaNacimiento && <p>{errors.fechaNacimiento}</p>}

        <input
          className="input-wrapper"
          name="correo"
          value={form.correo}
          onChange={handleChange}
          type="email"
          placeholder="Correo Electrónico"
          required
        />
        {errors.correo && <p>{errors.correo}</p>}

        <input
          className="input-wrapper"
          name="telefono"
          value={form.telefono}
          onChange={handleChange}
          type="text"
          placeholder="Teléfono (+506 ####-####)"
        />
        {errors.telefono && <p>{errors.telefono}</p>}

        <input
          className="input-wrapper"
          name="password"
          value={form.password}
          onChange={handleChange}
          type="password"
          placeholder="Contraseña"
          required
        />
        {errors.password && <p>{errors.password}</p>}

        <input
          className="input-wrapper"
          name="confirmarPassword"
          value={form.confirmarPassword}
          onChange={handleChange}
          type="password"
          placeholder="Confirmar contraseña"
          required
        />
        {errors.confirmarPassword && <p>{errors.confirmarPassword}</p>}

        <div className="form-group checkbox-group">
          <div className="checkbox-row">
            <input
              type="checkbox"
              id="terminos"
              name="aceptarTerminos"
              checked={form.aceptarTerminos}
              onChange={handleChange}
            />
            <nav className="checkbox-nav">
              <button type="button" onClick={() => setShowTerminos(true)}>
                Acepto los <strong>Términos y Condiciones</strong>
              </button>
            </nav>
          </div>
          {errors.aceptarTerminos && (
            <p className="error-text">{errors.aceptarTerminos}</p>
          )}
        </div>

        <nav>
          <button
            className="login-container-button"
            type="submit"
            disabled={loading || !form.aceptarTerminos}
          >
            {loading ? "Registrando..." : "Registrar"}
          </button>
        </nav>
      </form>
      {showTerminos && (
        <div className="modal-terminos">
          <div>
            <h2>Términos y Condiciones</h2>
            <iframe
              src="/Condiciones.pdf"
              width="100%"
              height="600px"
              title="Términos y Condiciones"
            />
            <button onClick={() => setShowTerminos(false)}>Cerrar</button>
          </div>
        </div>
      )}
      <nav>
        <button type="button" onClick={() => navigate("/login")}>
          Volver al login
        </button>
      </nav>
    </div>
  );
};

export default Registro;
