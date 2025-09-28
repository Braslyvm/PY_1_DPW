import React from "react";
import type { FC } from "react";
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper";
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

const cuentasEjemplo: Cuenta[] = [
  {
    account_id: "CR01-1234-5678-000000000001",
    alias: "Ahorros Principal",
    tipo: "Ahorro",
    moneda: "CRC",
    saldo: 1523400.5,
  },
  {
    account_id: "CR01-4321-8765-000000000002",
    alias: "Corriente USD",
    tipo: "Corriente",
    moneda: "USD",
    saldo: 2500.0,
  },
  {
    account_id: "CR01-1111-2222-000000000003",
    alias: "Ahorros Vacaciones",
    tipo: "Ahorro",
    moneda: "CRC",
    saldo: 500000.0,
  },
  {
    account_id: "CR01-3333-4444-000000000004",
    alias: "Cuenta Nómina",
    tipo: "Corriente",
    moneda: "CRC",
    saldo: 120000.75,
  },
];

const CarruselCuentas: FC = () => {
  const navigate = useNavigate();

  return (
    <section>
      <h2>Cuentas del Usuario (Ejemplo)</h2>
      <Swiper
        modules={[Navigation, Pagination]}
        navigation
        pagination={{ clickable: true }}
        spaceBetween={20}
        slidesPerView={1}
        breakpoints={{
          640: { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
        }}
      >
        {cuentasEjemplo.map((cuenta) => (
          <SwiperSlide key={cuenta.account_id}>
            <div className="cuenta-card">
              <h3>{cuenta.alias}</h3>
              <p>
                <strong>Tipo:</strong> {cuenta.tipo}
              </p>
              <p>
                <strong>Moneda:</strong> {cuenta.moneda}
              </p>
              <p>
                <strong>Saldo:</strong> {cuenta.saldo.toLocaleString()}{" "}
                {cuenta.moneda}
              </p>
              <button onClick={() => navigate(`/cuenta/${cuenta.account_id}`)}>
                Ver detalles
              </button>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};

export default CarruselCuentas;
