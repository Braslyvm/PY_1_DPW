import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { apiFetch } from "../config/Conectar";

type Tarjeta = {
  card_id: string;
  cuenta_id: string;      // IBAN de la cuenta asociada
  tipoId: number;         // 1, 2, 3
  tipo: string;           // Gold / Platinum / Black (para mostrar)
  numeroEnmascarado: string;
  exp: string;
  titular: string;
  monedaId: number;       // 1, 2
  moneda: string;         // CRC / USD (para mostrar)
  limite: number;
  saldo: number;
};

interface VerTarjetasProps {
  setActiveTab: (tab: string) => void;
  setSelectedCardId: (id: string) => void;
}

// Enmascara el número de tarjeta
const maskCardNumber = (numero: string) => {
  if (!numero) return "**** **** **** ****";
  if (numero.length !== 16) return numero;
  const p1 = numero.slice(0, 4);
  const p2 = numero.slice(4, 8);
  const p3 = numero.slice(8, 12);
  const p4 = numero.slice(12);
  return `${p1} ${p2.replace(/\d/g, "*")} ${p3.replace(/\d/g, "*")} ${p4}`;
};

// Mapea tipoId → texto
const mapTipoLabel = (tipoId: number): string => {
  switch (tipoId) {
    case 1:
      return "Gold";
    case 2:
      return "Platinum";
    case 3:
      return "Black";
    default:
      return "Desconocido";
  }
};

// Mapea monedaId → ISO
const mapMoneda = (monedaId: number): string => {
  switch (monedaId) {
    case 1:
      return "CRC";
    case 2:
      return "USD";
    default:
      return "DESCONOCIDA";
  }
};

const VerTarjetas: React.FC<VerTarjetasProps> = ({
  setActiveTab,
  setSelectedCardId,
}) => {
  const [tarjetas, setTarjetas] = useState<Tarjeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarTarjetas = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await apiFetch<any[]>("/api/v1/cards", {
          method: "GET",
          auth: true,
        });

        const normalizadas: Tarjeta[] = data.map((t) => {
          const tipoId = Number(t.tipo);
          const monedaId = Number(t.moneda);

          return {
            card_id: t.card_id,
            cuenta_id: t.cuenta_id,
            tipoId,
            tipo: mapTipoLabel(tipoId),
            numeroEnmascarado: maskCardNumber(t.numero_tarjeta || ""),
            exp: t.exp,
            titular: t.titular || "Titular no disponible",
            monedaId,
            moneda: mapMoneda(monedaId),
            limite: Number(t.limite) || 0,
            saldo: Number(t.saldo) || 0,
          };
        });

        setTarjetas(normalizadas);
      } catch (err: any) {
        console.error("Error al cargar tarjetas:", err);
        setError(err.message || "Error al cargar tarjetas");
      } finally {
        setLoading(false);
      }
    };

    cargarTarjetas();
  }, []);

  if (loading) {
    return (
      <section className="tarjetas-main">
        <h2 className="tarjetas-titulo">Cargando tarjetas...</h2>
      </section>
    );
  }

  if (error) {
    return (
      <section className="tarjetas-main">
        <h2 className="tarjetas-titulo">Error</h2>
        <p>{error}</p>
      </section>
    );
  }

  if (tarjetas.length === 0) {
    return (
      <section className="tarjetas-main">
        <h2 className="tarjetas-titulo">No se encontraron tarjetas</h2>
        <p>Actualmente no tienes tarjetas asociadas.</p>
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
                style={{
                  background: getBackground(tarjeta.tipo),
                  position: "relative",
                }}
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
                <div className="tarjeta-info" style={{ marginBottom: "10px" }}>
                  <h3>{tarjeta.cuenta_id}</h3>
                  <p style={{ margin: 0, fontSize: "0.9rem" }}>
                    {tarjeta.tipo} Card
                  </p>
                </div>

                <div className="tarjeta-info" style={{ marginBottom: "15px" }}>
                  <p
                    style={{
                      fontSize: "1.2rem",
                      letterSpacing: "2px",
                      margin: "5px 0",
                    }}
                  >
                    {tarjeta.numeroEnmascarado}
                  </p>
                  <p style={{ fontSize: "0.9rem" }}>Exp: {tarjeta.exp}</p>
                </div>
                <div className="tarjeta-info" style={{ marginBottom: "15px" }}>
                  <p>Cuenta IBAN: {tarjeta.cuenta_id}</p>
                </div>

                <div
                  className="tarjeta-info"
                  style={{
                    marginBottom: "20px",
                    fontWeight: 600,
                  }}
                >
                  <p>
                    Límite: {tarjeta.limite.toLocaleString()} {tarjeta.moneda}
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
