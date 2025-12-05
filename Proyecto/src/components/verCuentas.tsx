import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { apiFetch } from "../config/Conectar";

type Cuenta = {
  account_id: string;
  alias?: string | null;
  tipo: string;
  moneda: string;
  saldo: number;
};

interface VerCuentasProps {
  setActiveTab: (tab: string) => void;
  setSelectedAccountId: (id: string) => void;
}

const VerCuentas: React.FC<VerCuentasProps> = ({
  setActiveTab,
  setSelectedAccountId,
}) => {
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarCuentas = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiFetch<Cuenta[]>("/api/v1/accounts", {
          method: "GET",
          auth: true, 
        });
        setCuentas(data);
      } catch (err: any) {
        console.error("Error al cargar cuentas:", err);
        setError(err.message || "Error al cargar cuentas");
      } finally {
        setLoading(false);
      }
    };

    cargarCuentas();
  }, []);

  if (loading) {
    return (
      <section className="contenedor_main">
        <h2>Cargando cuentas...</h2>
      </section>
    );
  }

  if (error) {
    return (
      <section className="contenedor_main">
        <h2>Error</h2>
        <p>{error}</p>
      </section>
    );
  }

  if (cuentas.length === 0) {
    return (
      <section className="contenedor_main">
        <h2>No se encontraron cuentas</h2>
        <p>Actualmente no tienes cuentas asociadas a tu usuario.</p>
      </section>
    );
  }

  return (
    <section className="contenedor_main">
      <div className="cuentas-wrapper">
        <h2 className="titulo">Cuentas del usuario</h2>
        <p className="subtitulo">Gestiona y visualiza tus cuentas bancarias</p>
        <div className="swiper-wrapper-custom">
          <Swiper
            modules={[Navigation, Pagination]}
            navigation
            pagination={{ clickable: true }}
            spaceBetween={20}
            slidesPerView={1.2}
            observer={true}
            observeParents={true}
          >
            {cuentas.map((cuenta) => (
              <SwiperSlide key={cuenta.account_id}>
                <div className="cuenta-card">
                  <div className="cuenta-icono">
                    <span>💳</span>
                  </div>

                  <div className="cuenta-info">
                    <h3 className="cuenta-alias">
                      {cuenta.alias || cuenta.account_id}
                    </h3>
                    <p className="cuenta-tipo">Tipo: {cuenta.tipo}</p>
                    <p className="cuenta-moneda">Moneda: {cuenta.moneda}</p>
                    <p className="cuenta-saldo">
                      {cuenta.saldo.toLocaleString()} {cuenta.moneda}
                    </p>
                  </div>

                  <button
                    className="btn-detalles"
                    onClick={() => {
                      setSelectedAccountId(cuenta.account_id);
                      setActiveTab("detalleCuenta");
                    }}
                  >
                    Ver detalles →
                  </button>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        <div className="info-box">
          <div className="info-header">
            <span className="info-icon">ℹ️</span>
            <h4>Información importante</h4>
          </div>
          <p>
            Los saldos mostrados corresponden al último corte del día. Para
            consultas detalladas, haz clic en "Ver detalles" en cada cuenta.
          </p>
        </div>
      </div>
    </section>
  );
};

export default VerCuentas;
