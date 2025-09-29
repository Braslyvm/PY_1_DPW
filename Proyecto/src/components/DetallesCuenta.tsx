import React, { useEffect, useState } from "react";
import "../style/Detalles.css";

type Movimiento = {
  id: string;
  fecha: string;
  tipo: "CREDITO" | "DEBITO";
  descripcion: string;
  moneda: string;
  saldo: number;
};

type CuentaConMovimientos = {
  account_id: string;
  movimientos: Movimiento[];
};

interface DetallesCuentaProps {
  setActiveTab: (tab: string) => void;
  accountId: string;
}

const DetallesCuenta: React.FC<DetallesCuentaProps> = ({
  setActiveTab,
  accountId,
}) => {
  const [cuenta, setCuenta] = useState<CuentaConMovimientos | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tipoFiltro, setTipoFiltro] = useState<"TODOS" | "CREDITO" | "DEBITO">(
    "TODOS"
  );
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    const username = localStorage.getItem("username");
    if (!username) {
      setActiveTab("home");
      return;
    }

    setLoading(true);
    fetch(`https://py1dpw-production.up.railway.app/api/cuentas/${accountId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => setCuenta(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [accountId, setActiveTab]);

  if (loading)
    return <section className="contenedor_main">Cargando detalles...</section>;
  if (error)
    return <section className="contenedor_main">Error: {error}</section>;
  if (!cuenta)
    return <section className="contenedor_main">Cuenta no encontrada</section>;

  // Filtrar movimientos según tipo y búsqueda
  const movimientosFiltrados = cuenta.movimientos.filter((mov) => {
    const tipoMatch = tipoFiltro === "TODOS" || mov.tipo === tipoFiltro;
    const busquedaMatch =
      busqueda === "" ||
      mov.descripcion.toLowerCase().includes(busqueda.toLowerCase());
    return tipoMatch && busquedaMatch;
  });

  return (
    <section className="contenedor_main">
      <h1>Movimientos de la Cuenta: {cuenta.account_id}</h1>

      {/* Filtros */}
      <div
        style={{
          marginBottom: "15px",
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
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

      {/* Tabla */}
      {movimientosFiltrados.length === 0 ? (
        <p>No hay movimientos que coincidan con los filtros.</p>
      ) : (
        <main id="cuenta-main">
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
                  <td>{mov.saldo.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </main>
      )}

      <button onClick={() => setActiveTab("cuentas")}>Volver</button>
    </section>
  );
};

export default DetallesCuenta;
