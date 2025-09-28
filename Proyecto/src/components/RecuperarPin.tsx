import React, { useState, useEffect } from "react";
import "../style/barraProgreso.css";

// Componente principal de Consultar PIN
const ConsultarPIN: React.FC = () => {
  // Estados del componente
  const [fase, setFase] = useState<
    "identificacion" | "verificacion" | "mostrarPIN"
  >("identificacion");
  const [tipoValidacion, setTipoValidacion] = useState(""); // email o SMS
  const [valorValidacion, setValorValidacion] = useState(""); // correo o número de teléfono
  const [tokenGenerado, setTokenGenerado] = useState(""); // token simulado
  const [tokenIngresado, setTokenIngresado] = useState(""); // token que ingresa el usuario
  const [loading, setLoading] = useState(false); // estado de carga
  const [pin, setPin] = useState(""); // PIN a mostrar
  const [tiempoVisible, setTiempoVisible] = useState(0); // contador para ocultar PIN automáticamente

  // Función para enviar token simulado
  const handleEnviarToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valorValidacion) return alert("Ingrese correo o teléfono.");
    setLoading(true);
    setTimeout(() => {
      const token = "1234"; // token simulado
      setTokenGenerado(token);
      setFase("verificacion");
      setLoading(false);
      alert(`Token enviado al usuario: ${token}`);
    }, 1000); // simulamos retardo de envío
  };

  // Función para validar token ingresado
  const handleValidarToken = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (tokenIngresado === tokenGenerado) {
        // generar PIN aleatorio de 4 dígitos
        const nuevoPin = Math.floor(1000 + Math.random() * 9000).toString();
        setPin(nuevoPin);
        setFase("mostrarPIN");
        setTiempoVisible(8); // mostrar PIN por 8 segundos
      } else {
        alert("El código no es válido o ha expirado.");
      }
    }, 1000);
  };

  // Contador para autoocultar PIN
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (fase === "mostrarPIN" && tiempoVisible > 0) {
      timer = setTimeout(() => setTiempoVisible(tiempoVisible - 1), 1000);
    } else if (fase === "mostrarPIN" && tiempoVisible === 0) {
      setPin(""); // ocultar PIN
      setFase("identificacion"); // regresar al inicio
      setTokenGenerado("");
      setTokenIngresado("");
      setValorValidacion("");
      setTipoValidacion("");
    }
    return () => clearTimeout(timer);
  }, [tiempoVisible, fase]);

  // Copiar PIN al portapapeles
  const handleCopiarPIN = () => {
    navigator.clipboard.writeText(pin);
    alert("PIN copiado al portapapeles");
  };

  return (
    <main className="login-container">
      <header className="encabezado-recuperacion">
        <h1 className="titulo-recuperacion">Consultar PIN</h1>
        <div className="progress-container">
          {["Identificación", "Verificación", "Mostrar PIN"].map(
            (step, index) => {
              const faseIndex = [
                "identificacion",
                "verificacion",
                "mostrarPIN",
              ].indexOf(fase);
              return (
                <div key={step} className="step-item">
                  <div
                    className={`step-circle ${
                      index <= faseIndex ? "active" : ""
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="step-label">{step}</div>
                </div>
              );
            }
          )}
        </div>
      </header>

      {/* Paso 1: Identificación */}
      {fase === "identificacion" && (
        <section aria-label="Identificación">
          <form onSubmit={handleEnviarToken}>
            <label htmlFor="tipo">Validar por:</label>
            <select
              value={tipoValidacion}
              onChange={(e) => setTipoValidacion(e.target.value)}
              required
            >
              <option value="">Seleccione</option>
              <option value="email">Correo Electrónico</option>
              <option value="sms">SMS</option>
            </select>

            {tipoValidacion && (
              <div className="input-wrapper">
                <input
                  type={tipoValidacion === "email" ? "email" : "text"}
                  placeholder={
                    tipoValidacion === "email"
                      ? "Correo Electrónico"
                      : "Número de teléfono"
                  }
                  value={valorValidacion}
                  onChange={(e) => setValorValidacion(e.target.value)}
                  required
                />
              </div>
            )}

            <button type="submit" disabled={loading}>
              {loading ? "Enviando..." : "Enviar Código"}
            </button>
          </form>
        </section>
      )}

      {/* Paso 2: Verificación */}
      {fase === "verificacion" && (
        <section aria-label="Verificación">
          <form onSubmit={handleValidarToken}>
            <div className="input-wrapper">
              <input
                type="text"
                placeholder="Ingrese código recibido"
                value={tokenIngresado}
                onChange={(e) => setTokenIngresado(e.target.value)}
                required
              />
            </div>
            <button type="submit" disabled={loading}>
              {loading ? "Validando..." : "Validar Código"}
            </button>
            <button
              type="button"
              onClick={() =>
                alert(`Código reenviado al usuario: ${tokenGenerado}`)
              }
            >
              Reenviar Código
            </button>
          </form>
        </section>
      )}

      {/* Paso 3: Mostrar PIN */}
      {fase === "mostrarPIN" && (
        <section aria-label="PIN" className="success">
          <h2> PIN de la tarjeta:</h2>
          <div className="pin-container">
            <p className="pin">{pin}</p>
            <button onClick={handleCopiarPIN}>Copiar PIN</button>
          </div>
          <p>Se ocultará automáticamente en {tiempoVisible} segundos</p>
        </section>
      )}
    </main>
  );
};

export default ConsultarPIN;
