import React, { useEffect, useState } from "react";
import "../style/Detalles.css";
import { apiFetch } from "../config/Conectar";

type Movimiento = {
  id: string;
  fecha: string;
  tipo: "COMPRA" | "PAGO";
  descripcion: string;
  moneda: string; // ISO: CRC / USD
  saldo: number;  // monto del movimiento
};

type TarjetaInfo = {
  card_id: string;
  cuenta_id: string;
  tipo: string;
  numeroEnmascarado?: string;
  exp?: string;
  moneda?: string;
  limite?: number;
  saldo?: number;
};

interface DetalleTarjetaProps {
  setActiveTab: (tab: string) => void;
  cardId: string;
}

// Helpers de mapeo
const mapTipoMovimiento = (raw: any): "COMPRA" | "PAGO" => {
  if (typeof raw === "string") {
    const up = raw.toUpperCase();
    if (up === "COMPRA" || up === "PAGO") return up;
  } else if (typeof raw === "number") {
    // Por si el SP devuelve 1/2
    return raw === 1 ? "COMPRA" : "PAGO";
  }
  return "COMPRA";
};

const mapMoneda = (raw: any): string => {
  if (typeof raw === "string") {
    const up = raw.toUpperCase();
    if (up === "CRC" || up === "USD") return up;
    return up;
  }
  if (typeof raw === "number") {
    // Catálogo 1=CRC, 2=USD
    return raw === 2 ? "USD" : "CRC";
  }
  return "CRC";
};

const DetalleTarjeta: React.FC<DetalleTarjetaProps> = ({
  setActiveTab,
  cardId,
}) => {
  const [tarjeta, setTarjeta] = useState<TarjetaInfo | null>(null);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tipoFiltro, setTipoFiltro] = useState<"TODOS" | "COMPRA" | "PAGO">(
    "TODOS"
  );
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    const cargarDetalles = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1) Traer TODAS las tarjetas del usuario
        const cards = await apiFetch<any[]>("/api/v1/cards", {
          method: "GET",
          auth: true,
        });

        // 2) Buscar la tarjeta que coincide con cardId
        const card = cards.find((c) => c.card_id === cardId);
        if (!card) {
          throw new Error("Tarjeta no encontrada");
        }

        const monedaISO = mapMoneda(card.moneda);

        const tarjetaInfo: TarjetaInfo = {
          card_id: card.card_id,
          cuenta_id: card.cuenta_id,
          tipo:
            typeof card.tipo === "number"
              ? card.tipo === 1
                ? "Gold"
                : card.tipo === 2
                ? "Platinum"
                : "Black"
              : card.tipo,
          numeroEnmascarado: card.numero_tarjeta,
          exp: card.exp,
          moneda: monedaISO,
          limite: Number(card.limite) || 0,
          saldo: Number(card.saldo) || 0,
        };

        setTarjeta(tarjetaInfo);

        // 3) Movimientos por CUENTA asociada
        const movs = await apiFetch<any[]>(
          `/api/v1/accounts/${card.cuenta_id}/movements`,
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
          saldo: Number(m.monto || m.saldo || 0),
        }));

        setMovimientos(movsNormalizados);
      } catch (err: any) {
        console.error("Error cargando detalle de tarjeta:", err);
        setError(err.message || "Error cargando detalle de tarjeta");
      } finally {
        setLoading(false);
      }
    };

    cargarDetalles();
  }, [cardId]);

  if (loading)
    return (
      <section className="contenedor_main">Cargando movimientos...</section>
    );
  if (error)
    return <section className="contenedor_main">Error: {error}</section>;
  if (!tarjeta)
    return <section className="contenedor_main">Tarjeta no encontrada</section>;

  const movimientosFiltrados = movimientos.filter((mov) => {
    const tipoMatch = tipoFiltro === "TODOS" || mov.tipo === tipoFiltro;
    const busquedaMatch =
      busqueda === "" ||
      mov.descripcion.toLowerCase().includes(busqueda.toLowerCase());
    return tipoMatch && busquedaMatch;
  });

  return (
    <section className="contenedor_main">
      <h1 className="movimientos-header">
        Movimientos de la Tarjeta: {tarjeta.card_id}
      </h1>

      <div className="movimientos-resumen">
        <p>
          <strong>Cuenta asociada:</strong> {tarjeta.cuenta_id}
        </p>
        <p>
          <strong>Tipo:</strong> {tarjeta.tipo}
        </p>
        <p>
          <strong>Moneda:</strong> {tarjeta.moneda}
        </p>
        <p>
          <strong>Límite:</strong>{" "}
          {tarjeta.limite?.toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })}{" "}
          {tarjeta.moneda}
        </p>
        <p>
          <strong>Saldo actual:</strong>{" "}
          {tarjeta.saldo?.toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })}{" "}
          {tarjeta.moneda}
        </p>
      </div>

      <div className="movimientos-filtros">
        <select
          value={tipoFiltro}
          onChange={(e) => setTipoFiltro(e.target.value as any)}
        >
          <option value="TODOS">Todos</option>
          <option value="COMPRA">Compras</option>
          <option value="PAGO">Pagos</option>
        </select>
        <input
          type="text"
          placeholder="Buscar por descripción..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

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
                <th>Monto</th>
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

      <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
        <button
          className="movimientos-button"
          onClick={() => setActiveTab("recuperarPin")}
        >
          Recuperar PIN
        </button>
        <button
          className="movimientos-button"
          onClick={() => setActiveTab("tarjetas")}
        >
          Volver
        </button>
      </div>
    </section>
  );
};

export default DetalleTarjeta;
