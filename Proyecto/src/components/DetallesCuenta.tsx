import React, { useEffect, useState } from "react";
import "../style/Detalles.css";
import { apiFetch } from "../config/Conectar";

type Movimiento = {
  id: string;
  fecha: string;
  tipo: "CREDITO" | "DEBITO";
  descripcion: string;
  moneda: string;
  saldo: number;
};

type CuentaInfo = {
  account_id: string;
  tipo?: string;
  moneda?: string;
  saldo?: number;
};

interface DetallesCuentaProps {
  setActiveTab: (tab: string) => void;
  accountId: string;
}

// Helpers de mapeo
const mapTipoMovimiento = (raw: any): "CREDITO" | "DEBITO" => {
  if (typeof raw === "string") {
    const up = raw.toUpperCase();
    if (up === "CREDITO" || up === "DEBITO") return up;
  } else if (typeof raw === "number") {
    // Ajusta si tu SP usa otro catálogo
    return raw === 1 ? "CREDITO" : "DEBITO";
  }
  return "DEBITO";
};

const mapMoneda = (raw: any): string => {
  if (typeof raw === "string") {
    const up = raw.toUpperCase();
    if (up === "CRC" || up === "USD") return up;
    return up;
  }
  if (typeof raw === "number") {
    // 1=CRC, 2=USD
    return raw === 2 ? "USD" : "CRC";
  }
  return "CRC";
};

const mapTipoCuenta = (raw: any): string => {
  if (typeof raw === "string") return raw;
  if (typeof raw === "number") {
    // Si en BD usas catálogo 2=Corriente, 3=Crédito, etc.
    if (raw === 2) return "Corriente";
    if (raw === 3) return "Crédito";
  }
  return "Desconocido";
};

const DetallesCuenta: React.FC<DetallesCuentaProps> = ({
  setActiveTab,
  accountId,
}) => {
  const [cuenta, setCuenta] = useState<CuentaInfo | null>(null);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tipoFiltro, setTipoFiltro] = useState<"TODOS" | "CREDITO" | "DEBITO">(
    "TODOS"
  );
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    const cargarDetalles = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1) Detalle de la cuenta
        const cuentaData = await apiFetch<any>(`/api/v1/accounts/${accountId}`, {
          method: "GET",
          auth: true,
        });

        const cuentaInfo: CuentaInfo = {
          account_id: cuentaData.account_id,
          tipo: mapTipoCuenta(cuentaData.tipo),
          moneda: mapMoneda(cuentaData.moneda),
          saldo: Number(cuentaData.saldo) || 0,
        };

        setCuenta(cuentaInfo);

        // 2) Movimientos de la cuenta
        const movs = await apiFetch<any[]>(
          `/api/v1/accounts/${accountId}/movements`,
          {
            method: "GET",
            auth: true,
          }
        );

        const movsNormalizados: Movimiento[] = movs.map((m) => ({
          id: String(m.id || m.movimiento_id || m.codigo || "N/A"),
          fecha: m.fecha || m.fecha_movimiento || new Date().toISOString(),
          tipo: mapTipoMovimiento(m.tipo),
          descripcion: m.descripcion || m.detalle || "",
          moneda: mapMoneda(m.moneda),
          saldo: Number(m.saldo || m.monto || 0),
        }));

        setMovimientos(movsNormalizados);
      } catch (err: any) {
        console.error("Error cargando detalles de cuenta:", err);
        setError(err.message || "Error cargando detalles de cuenta");
      } finally {
        setLoading(false);
      }
    };

    cargarDetalles();
  }, [accountId]);

  if (loading)
    return <section className="contenedor_main">Cargando detalles...</section>;
  if (error)
    return <section className="contenedor_main">Error: {error}</section>;
  if (!cuenta)
    return <section className="contenedor_main">Cuenta no encontrada</section>;

  // Filtrar movimientos según tipo y búsqueda
  const movimientosFiltrados = movimientos.filter((mov) => {
    const tipoMatch = tipoFiltro === "TODOS" || mov.tipo === tipoFiltro;
    const busquedaMatch =
      busqueda === "" ||
      mov.descripcion.toLowerCase().includes(busqueda.toLowerCase());
    return tipoMatch && busquedaMatch;
  });

  return (
    <section className="contenedor_main">
      {/* Header */}
      <h1 className="movimientos-header">
        Movimientos de la Cuenta: {cuenta.account_id}
      </h1>

      {/* Resumen de la cuenta */}
      <div className="movimientos-resumen">
        <p>
          <strong>Tipo:</strong> {cuenta.tipo}
        </p>
        <p>
          <strong>Moneda:</strong> {cuenta.moneda}
        </p>
        <p>
          <strong>Saldo actual:</strong>{" "}
          {cuenta.saldo?.toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })}{" "}
          {cuenta.moneda}
        </p>
      </div>

      {/* Filtros */}
      <div className="movimientos-filtros">
        <select
          value={tipoFiltro}
          onChange={(e) => setTipoFiltro(e.target.value as any)}
        >
          <option value="TODOS">Todos</option>
          <option value="CREDITO">Créditos</option>
          <option value="DEBITO">Débitos</option>
        </select>
        <input
          type="text"
          placeholder="Buscar por descripción..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/* Tabla de movimientos */}
      {movimientosFiltrados.length === 0 ? (
        <p className="movimientos-empty">
          No hay movimientos que coincidan con los filtros.
        </p>
      ) : (
        <main className="movimientos-tabla">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Descripción</th>
                <th>Moneda</th>
                <th>Saldo</th>
              </tr>
            </thead>
            <tbody>
              {movimientosFiltrados.map((mov) => (
                <tr key={mov.id}>
                  <td>{mov.id}</td>
                  <td>{new Date(mov.fecha).toLocaleString()}</td>
                  <td>{mov.tipo}</td>
                  <td>{mov.descripcion}</td>
                  <td>{mov.moneda}</td>
                  <td>
                    {mov.saldo.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </main>
      )}

      <button
        className="movimientos-button"
        onClick={() => setActiveTab("cuentas")}
        style={{ marginTop: "15px" }}
      >
        Volver
      </button>
    </section>
  );
};

export default DetallesCuenta;
