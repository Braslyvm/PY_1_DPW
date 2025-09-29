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

  const maskCardNumber = (numero: string) => {
    if (numero.length < 8) return numero; 
    const primeros = numero.slice(0, 4);
    const ultimos = numero.slice(-4);
    const ocultos = "*".repeat(numero.length - 8);
    return `${primeros}${ocultos}${ultimos}`;
  };


const VerTarjetas: React.FC<VerTarjetasProps> = ({
  setActiveTab,
  setSelectedCardId,
}) => {
  const [tarjetas, setTarjetas] = useState<Tarjeta[]>([]);
  const username = localStorage.getItem("username");

  useEffect(() => {
    if (username) {
      fetch(
        `https://py1dpw-production.up.railway.app/api/usuarios/${username}/tarjetas`
      )
        .then((res) => res.json())
        .then((data) => setTarjetas(data))
        .catch((err) => console.error("Error al cargar tarjetas:", err));
    }
  }, [username]);

  if (tarjetas.length === 0) {
    return (
      <section className="tarjetas-main">
        <h2 className="tarjetas-titulo">Cargando tarjetas...</h2>
      </section>
    );
  }

  const getBackground = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case "gold":
        return "linear-gradient(135deg, #fbc02d, #fdd835)";
      case "platinum":
        return "linear-gradient(135deg, #b0bec5, #90a4ae)";
      case "black":
        return "linear-gradient(135deg, #000000ff, #0f2a4d)";
      default:
        return "#ccc";
    }
  };

 return (
  <section className="tarjetas-main">
    <h2 className="tarjetas-titulo">Mis Tarjetas</h2>
    <p className="tarjetas-subtitulo">Consulta tu saldo y movimientos</p>

    <div className="swiper-wrapper-tarjetas">
      <Swiper
        modules={[Navigation, Pagination]}
        navigation
        pagination={{ clickable: true }}
        spaceBetween={20}
        slidesPerView={1.2}
      >
        {tarjetas.map((tarjeta) => (
          <SwiperSlide key={tarjeta.card_id}>
            <div
              className="tarjeta-card"
              style={{ background: getBackground(tarjeta.tipo), position: "relative" }}
            >
              <div
                className="tarjeta-icono"
                style={{
                  position: "absolute",
                  top: "20px",
                  left: "750px",
                  fontSize: "2.5rem",
          
                }}
              >
                💳
              </div>

              <div className="tarjeta-info" style={{ marginBottom: "20px" }}>
                <h3>{tarjeta.tipo} Card</h3>
              </div>
              <div className="tarjeta-info" style={{ marginBottom: "15px" }}>
                <p
                  style={{
                    fontSize: "1.2rem",
                    letterSpacing: "2px",
                    margin: "5px 0",
                  }}
                >
                  {maskCardNumber(tarjeta.numeroEnmascarado)}
                </p>
                <p style={{ fontSize: "0.9rem" }}>Exp: {tarjeta.exp}</p>
              </div>
              <div className="tarjeta-info" style={{ marginBottom: "15px" }}>
                <p>Titular: {tarjeta.titular}</p>
              </div>
              <div
                className="tarjeta-info"
                style={{
                  marginBottom: "20px",
                  fontWeight: 600,
                }}
              >
                <p>
                  Saldo: {tarjeta.saldo.toLocaleString()} / Límite:{" "}
                  {tarjeta.limite.toLocaleString()} {tarjeta.moneda}
                </p>
              </div>
              <button
                className="btn-tarjeta-detalles"
                onClick={() => {
                  setSelectedCardId(tarjeta.card_id);
                  setActiveTab("detalleTarjeta");
                }}
              >
                Ver movimientos
              </button>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  </section>
);



};

export default VerTarjetas;
