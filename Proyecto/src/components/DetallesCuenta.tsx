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

  useEffect(() => {
    const username = localStorage.getItem("username");
    if (!username) {
      setActiveTab("home");
      return;
    }

    fetch(`http://localhost:4000/api/cuentas/${accountId}`)
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

  return (
    <section className="contenedor_main">
      <header id="cuenta-header">
        <h1>Movimientos de la Cuenta: {cuenta.account_id}</h1>
      </header>
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
            {cuenta.movimientos.map((mov) => (
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
      <button onClick={() => setActiveTab("cuentas")}>Volver</button>
    </section>
  );
};

export default DetallesCuenta;
