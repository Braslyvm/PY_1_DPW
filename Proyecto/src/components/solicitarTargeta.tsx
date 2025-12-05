import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { apiFetch } from "../config/Conectar";

type Cuenta = {
  account_id: string;
  alias: string;
  tipo: string;
  moneda: "CRC" | "USD" | string;
  saldo: number;
};

type TarjetaExistente = {
  card_id: string;
  cuentaAsignada: string; 
};

interface SolicitudTarjetaProps {
  setActiveTab: (tab: string) => void;
  username: string; 
}

const SolicitudTarjeta: React.FC<SolicitudTarjetaProps> = ({
  setActiveTab,
}) => {
  const nombreTitular = localStorage.getItem("nombreCompleto") || "Titular";

  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [tarjetasExistentes, setTarjetasExistentes] = useState<TarjetaExistente[]>([]);
  const [filtroTipo, setFiltroTipo] = useState<string>("");
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState<string>("");
  const [tipoTarjeta, setTipoTarjeta] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        const cuentasApi = await apiFetch<any[]>("/api/v1/accounts", {
          method: "GET",
          auth: true,
        });

        const cuentasNormalizadas: Cuenta[] = cuentasApi.map((c) => ({
          account_id: c.account_id,
          alias: c.alias || c.account_id,
          tipo: c.tipo,
          moneda:
            typeof c.moneda === "string"
              ? c.moneda
              : c.moneda === 1
              ? "CRC"
              : "USD",
          saldo: Number(c.saldo) || 0,
        }));

        setCuentas(cuentasNormalizadas);
        const tarjetasApi = await apiFetch<any[]>("/api/v1/cards", {
          method: "GET",
          auth: true,
        });

        const tarjetasNorm: TarjetaExistente[] = tarjetasApi.map((t) => ({
          card_id: t.card_id,
          cuentaAsignada: t.cuenta_id, 
        }));

        setTarjetasExistentes(tarjetasNorm);
      } catch (err) {
        console.error("Error cargando cuentas/tarjetas:", err);
        Swal.fire(
          "Error",
          "No se pudieron cargar las cuentas o tarjetas.",
          "error"
        );
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);
  const cuentasSinTarjeta = cuentas.filter(
    (c) => !tarjetasExistentes.some((t) => t.cuentaAsignada === c.account_id)
  );
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

  const limitePorTipo = (tipoId: number, cuenta: Cuenta) => {
    if (cuenta.tipo === "Ahorro" || cuenta.tipo === "Corriente") {
      return Math.round(cuenta.saldo * 100) / 100;
    }
    switch (tipoId) {
      case 1:
        return 5000;
      case 2: 
        return 10000;
      case 3:
        return 20000;
      default:
        return 1000;
    }
  };

  const getTipoLabel = (id: number) => {
    switch (id) {
      case 1:
        return "Gold";
      case 2:
        return "Platinum";
      case 3:
        return "Black";
      default:
        return "Desconocido";
    }
  };

  const getMonedaIdFromIso = (iso: string): number => {
    if (iso === "USD") return 2;
    return 1; 
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

    const tipoTarjetaId = parseInt(tipoTarjeta, 10); 
    const numero16 = generar16();
    const numeroEnmascarado = formatearEnmascarado(numero16);
    const exp = generarExp(4);
    const pin = generarPIN();
    const cvv = generarCVV();
    const limite = limitePorTipo(tipoTarjetaId, cuenta);
    const monedaId = getMonedaIdFromIso(cuenta.moneda);

    const confirm = await Swal.fire({
      title: "Confirmar creación de tarjeta",
      html: `
        <p><b>Cuenta:</b> ${cuenta.alias} (${cuenta.account_id})</p>
        <p><b>Tipo tarjeta:</b> ${getTipoLabel(tipoTarjetaId)}</p>
        <p><b>Número (visible):</b> ${numeroEnmascarado}</p>
        <p><b>Exp:</b> ${exp}</p>
        <p><b>Moneda:</b> ${cuenta.moneda}</p>
        <p><b>Límite:</b> ${limite.toLocaleString()}</p>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Crear tarjeta",
      cancelButtonText: "Cancelar",
    });

    if (!confirm.isConfirmed) return;

    try {
      await apiFetch("/api/v1/cards", {
        method: "POST",
        auth: true,
        body: JSON.stringify({
          card_id: `CARD-${Date.now()}`,
          cuenta_id: cuenta.account_id,
          tipo: tipoTarjetaId,
          numero_tarjeta: numero16,
          exp,
          moneda: monedaId, 
          limite,
        }),
      });

      await Swal.fire({
        title: "Tarjeta creada ✅",
        html: `
          <p><b>Titular:</b> ${nombreTitular}</p>
          <p><b>Número enmascarado:</b> ${numeroEnmascarado}</p>
          <p><b>Exp:</b> ${exp}</p>
          <p><b>PIN:</b> ${pin}</p>
          <p><b>CVV:</b> ${cvv}</p>
          <p><b>Moneda:</b> ${cuenta.moneda}</p>
          <p><b>Límite:</b> ${limite.toLocaleString()}</p>
        `,
        icon: "success",
        confirmButtonText: "Aceptar",
      });

      setActiveTab("tarjetas");
    } catch (err: any) {
      console.error("Error creando tarjeta:", err);
      Swal.fire(
        "Error",
        err.message || "No se pudo crear la tarjeta.",
        "error"
      );
    }
  };

  if (loading) {
    return (
      <section className="contenedor_main">
        <h2>Cargando información...</h2>
      </section>
    );
  }

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
                onChange={(e) => setTipoTarjeta(e.target.value)}
              >
                <option value="">Seleccione</option>
                <option value="1">Gold</option>
                <option value="2">Platinum</option>
                <option value="3">Black</option>
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
