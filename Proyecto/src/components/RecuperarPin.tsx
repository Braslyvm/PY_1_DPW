import React, { useState, useEffect } from "react";
import "../style/barraProgreso.css";
import { apiFetch } from "../config/Conectar";

interface ConsultarPINProps {
  setActiveTab: (tab: string) => void;
  cardId: string; 
}

const ConsultarPIN: React.FC<ConsultarPINProps> = ({
  setActiveTab,
  cardId,
}) => {

  const [fase, setFase] = useState<
    "identificacion" | "verificacion" | "mostrarPIN"
  >("identificacion");
  const [tipoValidacion, setTipoValidacion] = useState(""); 
  const [valorValidacion, setValorValidacion] = useState(""); 
  const [tokenGenerado, setTokenGenerado] = useState("");
  const [tokenIngresado, setTokenIngresado] = useState(""); 
  const [loading, setLoading] = useState(false); 
  const [pin, setPin] = useState("");
  const [tiempoVisible, setTiempoVisible] = useState(0); 

  // Paso 1: pedir OTP al backend
  const handleEnviarToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valorValidacion) {
      alert("Ingrese correo o teléfono para continuar.");
      return;
    }

    try {
      setLoading(true);

      const data = await apiFetch<{ codigo: string }>(
        `/api/v1/cards/${cardId}/otp`,
        {
          method: "POST",
          auth: true,
        }
      );

      setTokenGenerado(data.codigo);
      setFase("verificacion");
      alert(`OTP generado (modo demo): ${data.codigo}`);
    } catch (err: any) {
      console.error("Error generando OTP:", err);
      alert(err.message || "Error al generar código de verificación.");
    } finally {
      setLoading(false);
    }
  };

  const handleValidarToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenIngresado) {
      alert("Ingrese el código recibido.");
      return;
    }

    try {
      setLoading(true);
      await apiFetch(`/api/v1/cards/${cardId}/view-details`, {
        method: "POST",
        auth: true,
        body: JSON.stringify({ codigo: tokenIngresado }),
      });
      const nuevoPin = Math.floor(1000 + Math.random() * 9000).toString();
      setPin(nuevoPin);
      setFase("mostrarPIN");
      setTiempoVisible(8);
    } catch (err: any) {
      console.error("Error validando OTP:", err);
      alert(err.message || "El código no es válido o ha expirado.");
    } finally {
      setLoading(false);
    }
  };

  const handleReenviar = async () => {
    try {
      setLoading(true);

      const data = await apiFetch<{ codigo: string }>(
        `/api/v1/cards/${cardId}/otp`,
        {
          method: "POST",
          auth: true,
        }
      );

      setTokenGenerado(data.codigo);
      alert(`Nuevo código reenviado (demo): ${data.codigo}`);
    } catch (err: any) {
      console.error("Error reenviando OTP:", err);
      alert(err.message || "No se pudo reenviar el código.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (fase === "mostrarPIN" && tiempoVisible > 0) {
      timer = setTimeout(() => setTiempoVisible((t) => t - 1), 1000);
    } else if (fase === "mostrarPIN" && tiempoVisible === 0) {
      setPin(""); 
      setFase("identificacion"); 
      setTokenGenerado("");
      setTokenIngresado("");
      setValorValidacion("");
      setTipoValidacion("");


      setActiveTab("tarjetas");
    }
    return () => clearTimeout(timer);
  }, [tiempoVisible, fase, setActiveTab]);

  const handleCopiarPIN = () => {
    if (!pin) return;
    navigator.clipboard.writeText(pin);
    alert("PIN copiado al portapapeles");
  };

  return (
    <main className="login-container">
      <header className="encabezado-recuperacion">
        <h1 className="titulo-recuperacion">Consultar PIN de {cardId}</h1>
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
              onClick={handleReenviar}
              disabled={loading}
            >
              Reenviar Código
            </button>
          </form>
        </section>
      )}
      {fase === "mostrarPIN" && (
        <section aria-label="PIN" className="recuperarPIN-container">
          <h2>PIN de la tarjeta:</h2>
          <div className="recuperarPIN-pin-container">
            <p className="recuperarPIN-pin">{pin}</p>
            <button className="recuperarPIN-button" onClick={handleCopiarPIN}>
              Copiar PIN
            </button>
          </div>
          <p>Se ocultará automáticamente en {tiempoVisible} segundos</p>
        </section>
      )}
    </main>
  );
};

export default ConsultarPIN;
