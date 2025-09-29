import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";

type Cuenta = {
  account_id: string;
  alias: string;
  tipo: string;
  moneda: "CRC" | "USD";
  saldo: number;
};

type Tarjeta = {
  card_id: string;
  tipo: "Gold" | "Platinum" | "Black" | "NORMAL";
  numero: string;
  numeroEnmascarado: string;
  exp: string;
  pin: string;
  cvv: string;
  titular: string;
  moneda: "CRC" | "USD";
  limite: number;
  saldo: number;
  cuentaAsignada: string;
};

interface SolicitudTarjetaProps {
  setActiveTab: (tab: string) => void;
  username: string;
}

const SolicitudTarjeta: React.FC<SolicitudTarjetaProps> = ({
  setActiveTab,
  username,
}) => {
  const nombreTitular = localStorage.getItem("nombreCompleto") || "Titular";

  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [tarjetas, setTarjetas] = useState<Tarjeta[]>([]);
  const [filtroTipo, setFiltroTipo] = useState<string>("");
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState<string>("");
  const [tipoTarjeta, setTipoTarjeta] = useState<
    "Gold" | "Platinum" | "Black" | "NORMAL" | ""
  >("");

  // Cargar cuentas y tarjetas desde API o localStorage
  useEffect(() => {
    if (!username) return;

    fetch(
      `https://py1dpw-production.up.railway.app/api/usuarios/${username}/cuentas`
    )
      .then((res) => res.json())
      .then((data) => setCuentas(data || []))
      .catch(() => {
        const local = JSON.parse(localStorage.getItem("cuentas") || "[]");
        setCuentas(local);
      });

    fetch(
      `https://py1dpw-production.up.railway.app/api/usuarios/${username}/tarjetas`
    )
      .then((res) => res.json())
      .then((data) => setTarjetas(data || []))
      .catch(() => {
        const localT = JSON.parse(localStorage.getItem("tarjetas") || "[]");
        setTarjetas(localT);
      });
  }, [username]);

  // Filtrar cuentas que no tengan tarjeta asignada
  const cuentasSinTarjeta = cuentas.filter((c) => {
    return !tarjetas.some((t) => t.cuentaAsignada === c.account_id);
  });

  // Generar número de tarjeta 16 dígitos
  const generar16 = () => {
    const parts = [];
    for (let i = 0; i < 4; i++) {
      parts.push(Math.floor(1000 + Math.random() * 9000).toString());
    }
    return parts.join("");
  };

  const formatearEnmascarado = (num16: string) => {
    if (num16.length !== 16) return num16;
    const p1 = num16.slice(0, 4);
    const p4 = num16.slice(12);
    return `${p1} **** **** ${p4}`;
  };

  const generarExp = (yearsAhead = 4) => {
    const d = new Date();
    const mm = (d.getMonth() + 1).toString().padStart(2, "0");
    const yy = (d.getFullYear() + yearsAhead).toString().slice(-2);
    return `${mm}/${yy}`;
  };

  const generarPIN = () => Math.floor(1000 + Math.random() * 9000).toString();
  const generarCVV = () => Math.floor(100 + Math.random() * 900).toString();

  // Limite por tipo de tarjeta
  const limitePorTipo = (tipo: Tarjeta["tipo"], cuenta: Cuenta) => {
    if (cuenta.tipo === "Ahorro" || cuenta.tipo === "Corriente") {
      return Math.round(cuenta.saldo * 100) / 100;
    }
    switch (tipo) {
      case "Gold":
        return 5000;
      case "Platinum":
        return 10000;
      case "Black":
        return 20000;
      default:
        return 1000;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cuentaSeleccionada) {
      Swal.fire("Error", "Selecciona una cuenta disponible.", "error");
      return;
    }
    if (!tipoTarjeta) {
      Swal.fire("Error", "Selecciona un tipo de tarjeta.", "error");
      return;
    }

    const cuenta = cuentas.find((c) => c.account_id === cuentaSeleccionada);
    if (!cuenta) {
      Swal.fire("Error", "Cuenta no encontrada.", "error");
      return;
    }

    const numero16 = generar16();
    const tarjeta: Tarjeta = {
      card_id: `CARD-${Date.now()}`,
      tipo: tipoTarjeta as Tarjeta["tipo"],
      numero: numero16,
      numeroEnmascarado: formatearEnmascarado(numero16),
      exp: generarExp(4),
      pin: generarPIN(),
      cvv: generarCVV(),
      titular: nombreTitular,
      moneda: cuenta.moneda,
      limite: limitePorTipo(tipoTarjeta as Tarjeta["tipo"], cuenta),
      saldo: 0,
      cuentaAsignada: cuenta.account_id,
    };

    const confirm = await Swal.fire({
      title: "Confirmar creación de tarjeta",
      html: `
        <p><b>Cuenta:</b> ${cuenta.alias} (${cuenta.account_id})</p>
        <p><b>Tipo tarjeta:</b> ${tarjeta.tipo}</p>
        <p><b>Número (visible):</b> ${tarjeta.numeroEnmascarado}</p>
        <p><b>Exp:</b> ${tarjeta.exp}</p>
        <p><b>Moneda:</b> ${tarjeta.moneda}</p>
        <p><b>Límite:</b> ${tarjeta.limite.toLocaleString()}</p>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Crear tarjeta",
      cancelButtonText: "Cancelar",
    });

    if (!confirm.isConfirmed) return;

    // Guardar localmente (simulación)
    const localT: Tarjeta[] = JSON.parse(
      localStorage.getItem("tarjetas") || "[]"
    );
    localT.push(tarjeta);
    localStorage.setItem("tarjetas", JSON.stringify(localT));

    await Swal.fire({
      title: "Tarjeta creada ✅",
      html: `
        <p><b>Número enmascarado:</b> ${tarjeta.numeroEnmascarado}</p>
        <p><b>Exp:</b> ${tarjeta.exp}</p>
        <p><b>PIN:</b> ${tarjeta.pin}</p>
        <p><b>CVV:</b> ${tarjeta.cvv}</p>
        <p><b>Moneda:</b> ${tarjeta.moneda}</p>
        <p><b>Límite:</b> ${tarjeta.limite.toLocaleString()}</p>
      `,
      icon: "success",
      confirmButtonText: "Aceptar",
    });

    setActiveTab("tarjetas");
  };

  return (
    <section className="contenedor_main">
      <div className="registrarcuenta-form-wrapper">
        <header className="registrarcuenta-header">
          <h2>Solicitar Tarjeta</h2>
          <p>Complete los datos para solicitar una nueva tarjeta</p>
        </header>
        <main>
          <form className="registrarcuenta-form" onSubmit={handleSubmit}>
            <div>
              <label>Filtrar por tipo de cuenta:</label>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
              >
                <option value="">Todas</option>
                <option value="Ahorro">Ahorro</option>
                <option value="Corriente">Corriente</option>
                <option value="Credito">Crédito</option>
              </select>
            </div>

            <div>
              <label>Cuenta (solo cuentas sin tarjeta):</label>
              <select
                required
                value={cuentaSeleccionada}
                onChange={(e) => setCuentaSeleccionada(e.target.value)}
              >
                <option value="">Seleccione cuenta</option>
                {cuentasSinTarjeta
                  .filter((c) => !filtroTipo || c.tipo === filtroTipo)
                  .map((c) => (
                    <option key={c.account_id} value={c.account_id}>
                      {c.alias} — {c.tipo} — {c.moneda} — Saldo:{" "}
                      {c.saldo.toLocaleString()}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label>Tipo de tarjeta:</label>
              <select
                required
                value={tipoTarjeta}
                onChange={(e) => setTipoTarjeta(e.target.value as any)}
              >
                <option value="">Seleccione</option>
                <option value="Gold">Gold</option>
                <option value="Platinum">Platinum</option>
                <option value="Black">Black</option>
                <option value="NORMAL">NORMAL</option>
              </select>
            </div>

            <div className="registrarcuenta-buttons">
              <button type="submit">Solicitar tarjeta</button>
              <button type="button" onClick={() => setActiveTab("tarjetas")}>
                Cancelar
              </button>
            </div>
          </form>
        </main>
      </div>
    </section>

  );
};

export default SolicitudTarjeta;
