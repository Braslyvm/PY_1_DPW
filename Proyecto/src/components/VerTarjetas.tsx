import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

type Tarjeta = {
  card_id: string;
  tipo: "Gold" | "Platinum" | "Black";
  numeroEnmascarado: string;
  exp: string;
  titular: string;
  moneda: string;
  limite: number;
  saldo: number;
};

interface VerTarjetasProps {
  setActiveTab: (tab: string) => void;
  setSelectedCardId: (id: string) => void;
}

const VerTarjetas: React.FC<VerTarjetasProps> = ({
  setActiveTab,
  setSelectedCardId,
}) => {
  const [tarjetas, setTarjetas] = useState<Tarjeta[]>([]);
  const username = localStorage.getItem("username");

  useEffect(() => {
    if (username) {
      fetch(`http://localhost:4000/api/usuarios/${username}/tarjetas`)
        .then((res) => res.json())
        .then((data) => setTarjetas(data))
        .catch((err) => console.error("Error al cargar tarjetas:", err));
    }
  }, [username]);

  if (tarjetas.length === 0) {
    return (
      <section className="contenedor_main">
        <h2>Cargando tarjetas...</h2>
      </section>
    );
  }

  const getBackground = (tipo: string) => {
    switch (tipo) {
      case "Gold":
        return "linear-gradient(135deg, #FFD700, #FFA500)";
      case "Platinum":
        return "linear-gradient(135deg, #C0C0C0, #A9A9A9)";
      case "Black":
        return "linear-gradient(135deg, #000000, #434343)";
      default:
        return "#ccc";
    }
  };

  return (
    <section className="contenedor_main">
      <h2>Mis Tarjetas</h2>
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <Swiper
          modules={[Navigation, Pagination]}
          navigation
          pagination={{ clickable: true }}
          spaceBetween={20}
          slidesPerView={1.2}
        >
          {tarjetas.map((tarjeta) => (
            <SwiperSlide
              key={tarjeta.card_id}
              style={{
                background: getBackground(tarjeta.tipo),
                padding: "20px",
                borderRadius: "12px",
                color: "white",
                minHeight: "180px",
              }}
            >
              <h3>{tarjeta.tipo} Card</h3>
              <p>{tarjeta.numeroEnmascarado}</p>
              <p>Exp: {tarjeta.exp}</p>
              <p>Titular: {tarjeta.titular}</p>
              <p>
                Saldo: {tarjeta.saldo.toLocaleString()} / Límite:{" "}
                {tarjeta.limite.toLocaleString()} {tarjeta.moneda}
              </p>
              <button
                onClick={() => {
                  setSelectedCardId(tarjeta.card_id);
                  setActiveTab("detalleTarjeta");
                }}
                style={{
                  marginTop: "10px",
                  padding: "8px 12px",
                  border: "none",
                  borderRadius: "6px",
                  backgroundColor: "#fff",
                  color: "#333",
                  cursor: "pointer",
                }}
              >
                Ver movimientos
              </button>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
};

export default VerTarjetas;
