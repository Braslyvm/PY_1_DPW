import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";

// ====== Interfaces ======
interface Cuenta {
  account_id: string;
  alias: string;
  tipo: string;
  moneda: string;
  saldo: number;
}

interface Usuario {
  username: string;
  nombreCompleto: string;
  cuentas: Cuenta[];
}

// Props del componente
interface TransferenciasProps {
  username: string;
}

// Datos de transferencia
interface TransferenciaData {
  tipo: "propia" | "tercero";
  origen: string;
  destino: string;
  monto: number;
  moneda: string;
  descripcion?: string;
  fecha?: string;
  titularDestino?: string;
}

const Transferencias: React.FC<TransferenciasProps> = ({ username }) => {
  const [tipo, setTipo] = useState<"propia" | "tercero">("propia");
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [form, setForm] = useState<TransferenciaData>({
    tipo: "propia",
    origen: "",
    destino: "",
    monto: 0,
    moneda: "",
    descripcion: "",
  });
  const [validDest, setValidDest] = useState<{
    existe: boolean;
    titular?: string;
  }>({ existe: true });
  const [error, setError] = useState("");

  // ====== Obtener cuentas ======
  useEffect(() => {
    const fetchCuentas = async () => {
      try {
        const res = await fetch(
          `https://py1dpw-production.up.railway.app/api/usuarios/${username}/cuentas`
        );
        if (!res.ok) throw new Error("Error al obtener cuentas");
        const data: Cuenta[] = await res.json();
        setCuentas(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCuentas();
  }, [username]);

  // ====== Validar cuenta destino terceros ======
  const validarCuentaDestino = async (accountId: string) => {
    try {
      const res = await fetch(
        `https://py1dpw-production.up.railway.app/api/usuarios`
      );
      const usuarios: Usuario[] = await res.json();
      for (const u of usuarios) {
        const cuenta = u.cuentas.find((c) => c.account_id === accountId);
        if (cuenta) return { existe: true, titular: u.nombreCompleto };
      }
      return { existe: false };
    } catch (err) {
      console.error(err);
      return { existe: false };
    }
  };

  // ====== Cambios de formulario ======
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "monto" ? (value === "" ? 0 : parseFloat(value)) : value,
    }));

    if (tipo === "tercero" && name === "destino") {
      validarCuentaDestino(value).then((res) => setValidDest(res));
    }
  };

  // ====== Continuar y mostrar confirmación con SweetAlert ======
  const handleContinuar = async (e: React.FormEvent) => {
    e.preventDefault();

    if (tipo === "tercero" && !validDest.existe) {
      setError("La cuenta destino no existe");
      return;
    }

    const origenCuenta = cuentas.find((c) => c.account_id === form.origen);

    const nuevoForm: TransferenciaData = {
      ...form,
      tipo,
      fecha: new Date().toISOString(),
      titularDestino:
        tipo === "tercero"
          ? validDest.titular
          : cuentas.find((c) => c.account_id === form.destino)?.alias,
      moneda: origenCuenta?.moneda || "",
    };

    setForm(nuevoForm);
    setError("");

    // ==== SweetAlert de confirmación ====
    const result = await Swal.fire({
      title: "Confirmar transferencia",
      html: `
        <b>Tipo:</b> ${nuevoForm.tipo}<br/>
        <b>Origen:</b> ${nuevoForm.origen}<br/>
        <b>Destino:</b> ${nuevoForm.destino} (${nuevoForm.titularDestino})<br/>
        <b>Monto:</b> ${nuevoForm.monto.toFixed(2)} ${nuevoForm.moneda}<br/>
        <b>Descripción:</b> ${nuevoForm.descripcion || "-"}<br/>
        <b>Fecha:</b> ${nuevoForm.fecha}<br/>
      `,
      icon: "info",
      showCancelButton: true,
      confirmButtonText: "Confirmar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      // ==== SweetAlert con comprobante y descarga JSON ====
      await Swal.fire({
        title: "Comprobante",
        html: `
          <b>Tipo:</b> ${nuevoForm.tipo}<br/>
          <b>Origen:</b> ${nuevoForm.origen}<br/>
          <b>Destino:</b> ${nuevoForm.destino} (${
          nuevoForm.titularDestino
        })<br/>
          <b>Monto:</b> ${nuevoForm.monto.toFixed(2)} ${nuevoForm.moneda}<br/>
          <b>Descripción:</b> ${nuevoForm.descripcion || "-"}<br/>
          <b>Fecha:</b> ${nuevoForm.fecha}<br/>
        `,
        showCancelButton: true,
        confirmButtonText: "Cerrar",
        cancelButtonText: "Descargar JSON",
      }).then((res) => {
        if (res.dismiss === Swal.DismissReason.cancel) {
          const blob = new Blob([JSON.stringify(nuevoForm, null, 2)], {
            type: "application/json",
          });
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = `comprobante_${Date.now()}.json`;
          link.click();
        }
      });

      // Limpiar formulario
      setForm({
        tipo,
        origen: "",
        destino: "",
        monto: 0,
        moneda: "",
        descripcion: "",
      });
      setValidDest({ existe: true });
    }
  };

  return (
  <section className="contenedor_main">
    <div className="registrarcuenta-form-wrapper">
      <header className="registrarcuenta-header">
        <h2>Transferencias</h2>
        <p>Complete los datos para realizar una transferencia</p>
      </header>
      <main>
        <form className="registrarcuenta-form" onSubmit={handleContinuar}>
          <div>
            <label>Tipo de transferencia:</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as "propia" | "tercero")}
            >
              <option value="propia">Cuentas propias</option>
              <option value="tercero">Terceros mismo banco</option>
            </select>
          </div>

          <div>
            <label>Cuenta origen:</label>
            <select
              name="origen"
              value={form.origen}
              onChange={handleChange}
              required
            >
              <option value="">Seleccione cuenta</option>
              {cuentas.map((c) => (
                <option key={c.account_id} value={c.account_id}>
                  {c.alias} ({c.moneda}) - Saldo: {c.saldo.toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          {tipo === "propia" ? (
            <div>
              <label>Cuenta destino:</label>
              <select
                name="destino"
                value={form.destino}
                onChange={handleChange}
                required
              >
                <option value="">Seleccione cuenta</option>
                {cuentas
                  .filter((c) => c.account_id !== form.origen)
                  .map((c) => (
                    <option key={c.account_id} value={c.account_id}>
                      {c.alias} ({c.moneda}) - Saldo: {c.saldo.toFixed(2)}
                    </option>
                  ))}
              </select>
            </div>
          ) : (
            <div>
              <label>Cuenta destino (número):</label>
              <input
                type="text"
                name="destino"
                value={form.destino}
                onChange={handleChange}
                required
              />
              {!validDest.existe && (
                <p style={{ color: "red" }}>Cuenta destino no encontrada</p>
              )}
            </div>
          )}

          <div>
            <label>Moneda:</label>
            <input type="text" value={form.moneda || ""} readOnly />
          </div>

          <div>
            <label>Monto:</label>
            <input
              type="number"
              step="0.01"
              name="monto"
              value={form.monto || 0}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label>Descripción (opcional):</label>
            <input
              type="text"
              name="descripcion"
              maxLength={255}
              value={form.descripcion}
              onChange={handleChange}
            />
          </div>

          <div className="registrarcuenta-buttons">
            <button
              type="submit"
              disabled={!form.origen || !form.destino || form.monto <= 0}
            >
              Continuar
            </button>

          </div>
        </form>

        {error && <p style={{ color: "red" }}>{error}</p>}
      </main>
    </div>
  </section>
);

};

export default Transferencias;
