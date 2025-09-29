import React, { useEffect, useState } from "react";
import "../style/Detalles.css";

type Movimiento = {
  id: string;
  fecha: string;
  tipo: "COMPRA" | "PAGO";
  descripcion: string;
  moneda: string;
  saldo: number;
};

type TarjetaConMovimientos = {
  card_id: string;
  movimientos: Movimiento[];
};

interface DetalleTarjetaProps {
  setActiveTab: (tab: string) => void;
  cardId: string;
}

const DetalleTarjeta: React.FC<DetalleTarjetaProps> = ({
  setActiveTab,
  cardId,
}) => {
  const [tarjeta, setTarjeta] = useState<TarjetaConMovimientos | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tipoFiltro, setTipoFiltro] = useState<"TODOS" | "COMPRA" | "PAGO">(
    "TODOS"
  );
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(`https://py1dpw-production.up.railway.app/api/tarjetas/${cardId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => setTarjeta(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [cardId]);

  if (loading)
    return (
      <section className="contenedor_main">Cargando movimientos...</section>
    );
  if (error)
    return <section className="contenedor_main">Error: {error}</section>;
  if (!tarjeta)
    return <section className="contenedor_main">Tarjeta no encontrada</section>;

  const movimientosFiltrados = tarjeta.movimientos.filter((mov) => {
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
                <td>{mov.saldo.toLocaleString()}</td>
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
