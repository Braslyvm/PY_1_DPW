import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

type Cuenta = {
  account_id: string;
  alias: string;
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
  const username = localStorage.getItem("username");

  useEffect(() => {
    if (username) {
      fetch(
        `https://py1dpw-production.up.railway.app/api/usuarios/${username}/cuentas`
      )
        .then((res) => res.json())
        .then((data) => setCuentas(data))
        .catch((err) => console.error("Error al cargar cuentas:", err));
    }
  }, [username]);

  if (cuentas.length === 0) {
    return (
      <section className="contenedor_main">
        <h2>Cargando cuentas...</h2>
      </section>
    );
  }

  return (
    <section className="contenedor_main">
      <h2>Cuentas del Usuario</h2>
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
                <h3>{cuenta.alias}</h3>
                <p><strong>Tipo:</strong> {cuenta.tipo}</p>
                <p><strong>Moneda:</strong> {cuenta.moneda}</p>
                <p><strong>Saldo:</strong> {cuenta.saldo.toLocaleString()} {cuenta.moneda}</p>
                <button
                  onClick={() => {
                    setSelectedAccountId(cuenta.account_id);
                    setActiveTab("detalleCuenta");
                  }}
                >
                  Ver detalles
                </button>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>

  );
};

export default VerCuentas;
