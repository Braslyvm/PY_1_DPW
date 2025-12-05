import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { apiFetch } from "../config/Conectar";

// ====== Interfaces ======
interface Cuenta {
  account_id: string;
  alias: string;
  tipo: string;
  moneda: string; 
  saldo: number | string; 
}

type TipoTransferencia = "propia" | "interbanco";

interface TransferenciaData {
  tipo: TipoTransferencia;
  origen: string;
  destino: string;
  monto: number;
  moneda: string; 
  tipo_mov?: number; 
  descripcion?: string;
  fecha?: string;
  titularDestino?: string;
}


const normalizeIban = (iban: string) =>
  iban.replace(/[\s-]/g, "").toUpperCase();

const isValidCostaRicaIban = (iban: string): boolean => {
  if (typeof iban !== "string") return false;
  const normalized = normalizeIban(iban);
  const regex = /^CR01B0[1-8][0-9]{12}$/;
  return regex.test(normalized);
};

const toNumero = (valor: number | string): number => {
  if (typeof valor === "number") return valor;
  const n = parseFloat(valor);
  return isNaN(n) ? 0 : n;
};


const monedaToId = (moneda: string): number => {
  const m = moneda.toUpperCase();
  if (m === "USD") return 2;
  return 1; 
};

const Transferencias: React.FC = () => {
  const [tipo, setTipo] = useState<TipoTransferencia>("propia");
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<TransferenciaData>({
    tipo: "propia",
    origen: "",
    destino: "",
    monto: 0,
    moneda: "",
    tipo_mov: 2,
    descripcion: "",
  });
  const [error, setError] = useState("");

  // ========= Cargar cuentas (reutilizable) =========
  const cargarCuentas = async () => {
    try {
      setLoading(true);
      setError("");
      // truco anti-304: query param único
      const data = await apiFetch<Cuenta[]>(`/api/v1/accounts?_=${Date.now()}`, {
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

  useEffect(() => {
    cargarCuentas();
  }, []);


  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "monto") {
      setForm((prev) => ({
        ...prev,
        monto: value === "" ? 0 : parseFloat(value),
      }));
      return;
    }

    if (name === "tipo_mov") {
      setForm((prev) => ({
        ...prev,
        tipo_mov: value === "" ? undefined : parseInt(value, 10) || 2,
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

 
    if (name === "origen") {
      const cuentaOrigen = cuentas.find((c) => c.account_id === value);
      if (cuentaOrigen) {
        setForm((prev) => ({
          ...prev,
          moneda: cuentaOrigen.moneda, 
        }));
      }
    }
  };


  const realizarTransferencia = async (
    data: TransferenciaData
  ): Promise<{ mensaje: string; id?: string; reason?: string }> => {
    const fromNorm = normalizeIban(data.origen);
    const toNorm = normalizeIban(data.destino);


    if (data.tipo === "interbanco" && !isValidCostaRicaIban(toNorm)) {
      throw new Error("El IBAN destino no tiene un formato válido.");
    }

    const cuentaOrigen = cuentas.find((c) => c.account_id === data.origen);
    if (cuentaOrigen && data.monto > toNumero(cuentaOrigen.saldo)) {
      throw new Error(
        "El monto excede el saldo disponible en la cuenta origen."
      );
    }

    const monedaFinalStr = (
      data.moneda ||
      cuentaOrigen?.moneda ||
      "CRC"
    ).toUpperCase();

    const esMismoBanco = data.tipo === "propia";

    if (esMismoBanco) {
      const tipoMovFinal = data.tipo_mov ?? 2; o

      const payload = {
        origen: fromNorm,
        destino: toNorm,
        tipo_mov: tipoMovFinal,
        moneda: monedaToId(monedaFinalStr), 
        monto: data.monto,
        descripcion:
          data.descripcion || "Transferencia entre cuentas de ahorro",
      };

      const json = await apiFetch<{
        mensaje: string;
        id?: string;
        reason?: string;
      }>("/api/v1/transfers/internal", {
        method: "POST",
        body: JSON.stringify(payload),
        auth: true,
      });

      return json;
    }

    const payloadInterbank = {
      from: fromNorm,
      to: toNorm,
      amount: data.monto,
      currency: monedaFinalStr,
      description:
        data.descripcion || "Transferencia entre cuentas de ahorro",
    };

    const json = await apiFetch<{
      mensaje: string;
      id?: string;
      reason?: string;
    }>("/api/v1/transfers/interbank", {
      method: "POST",
      body: JSON.stringify(payloadInterbank),
      auth: true,
    });

    return json;
  };

  const handleContinuar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.origen || !form.destino || form.monto <= 0) {
      setError("Debe completar todos los campos obligatorios.");
      return;
    }

    if (tipo === "interbanco" && !isValidCostaRicaIban(form.destino)) {
      setError("El IBAN destino no tiene un formato válido.");
      return;
    }

    const origenCuenta = cuentas.find((c) => c.account_id === form.origen);
    const nuevoForm: TransferenciaData = {
      ...form,
      tipo,
      fecha: new Date().toISOString(),
      titularDestino:
        tipo === "propia"
          ? cuentas.find((c) => c.account_id === form.destino)?.alias
          : undefined,
      moneda: (form.moneda || origenCuenta?.moneda || "CRC").toUpperCase(),
      tipo_mov: form.tipo_mov ?? 2,
    };
    setForm(nuevoForm);

    const textoTipo =
      nuevoForm.tipo === "propia"
        ? "Cuentas propias"
        : "Interbancaria (otro banco)";

    const result = await Swal.fire({
      title: "Confirmar transferencia",
      html: `
        <b>Tipo:</b> ${textoTipo}<br/>
        <b>Origen:</b> ${nuevoForm.origen}<br/>
        <b>Destino:</b> ${nuevoForm.destino}${
          nuevoForm.titularDestino ? ` (${nuevoForm.titularDestino})` : ""
        }<br/>
        <b>Monto:</b> ${nuevoForm.monto.toFixed(2)} ${nuevoForm.moneda}<br/>
        ${
          nuevoForm.tipo === "propia"
            ? `<b>Tipo de movimiento:</b> ${
                nuevoForm.tipo_mov === 3 ? "Crédito" : "Corriente"
              }<br/>`
            : ""
        }
        <b>Descripción:</b> ${nuevoForm.descripcion || "-"}<br/>
        <b>Fecha:</b> ${nuevoForm.fecha}<br/>
      `,
      icon: "info",
      showCancelButton: true,
      confirmButtonText: "Confirmar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    try {
      Swal.fire({
        title: "Procesando transferencia...",
        didOpen: () => Swal.showLoading(),
        allowOutsideClick: false,
        showConfirmButton: false,
      });

      const respuesta = await realizarTransferencia(nuevoForm);
      Swal.close();

      await cargarCuentas();

      await Swal.fire({
        title: "Transferencia realizada",
        html: `
          <b>Mensaje:</b> ${respuesta.mensaje || "Operación exitosa"}<br/><br/>
          <b>Tipo:</b> ${textoTipo}<br/>
          <b>Origen:</b> ${nuevoForm.origen}<br/>
          <b>Destino:</b> ${nuevoForm.destino}${
            nuevoForm.titularDestino ? ` (${nuevoForm.titularDestino})` : ""
          }<br/>
          <b>Monto:</b> ${nuevoForm.monto.toFixed(2)} ${nuevoForm.moneda}<br/>
          ${
            nuevoForm.tipo === "propia"
              ? `<b>Tipo de movimiento:</b> ${
                  nuevoForm.tipo_mov === 3 ? "Crédito" : "Corriente"
                }<br/>`
              : ""
          }
          <b>Descripción:</b> ${nuevoForm.descripcion || "-"}<br/>
          <b>Fecha:</b> ${nuevoForm.fecha}<br/>
        `,
        icon: "success",
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

      setForm({
        tipo,
        origen: "",
        destino: "",
        monto: 0,
        moneda: "",
        tipo_mov: 2,
        descripcion: "",
      });
    } catch (err: any) {
      Swal.close();
      console.error(err);
      const msg =
        err.message ||
        "Ocurrió un error procesando la transferencia (verifica el backend).";
      setError(msg);
      await Swal.fire({
        title: "Error",
        text: msg,
        icon: "error",
      });
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
          {loading && <p>Cargando cuentas...</p>}
          <form className="registrarcuenta-form" onSubmit={handleContinuar}>
            <div>
              <label>Tipo de transferencia:</label>
              <select
                value={tipo}
                onChange={(e) => {
                  const value = e.target.value as TipoTransferencia;
                  setTipo(value);
                  setForm((prev) => ({
                    ...prev,
                    tipo: value,
                    destino: "",
                  }));
                  setError("");
                }}
              >
                <option value="propia">Cuentas propias</option>
                <option value="interbanco">Interbancaria (otro banco)</option>
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
                    {c.account_id} - Saldo: {toNumero(c.saldo).toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            {tipo === "propia" ? (
              <div>
                <label>Cuenta destino (propia):</label>
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
                        {c.account_id} - Saldo:{" "}
                        {toNumero(c.saldo).toFixed(2)}
                      </option>
                    ))}
                </select>
              </div>
            ) : (
              <div>
                <label>Cuenta destino (IBAN otro banco):</label>
                <input
                  type="text"
                  name="destino"
                  value={form.destino}
                  onChange={handleChange}
                  placeholder="CR01B0XXXXXXXXXXXX"
                  required
                />
              </div>
            )}

            {tipo === "propia" && (
              <div>
                <label>Tipo de movimiento (mismo banco):</label>
                <select
                  name="tipo_mov"
                  value={String(form.tipo_mov ?? 2)}
                  onChange={handleChange}
                >
                  <option value="2">Corriente</option>
                  <option value="3">Crédito</option>
                </select>
              </div>
            )}

            <div>
              <label>Moneda:</label>
              <select
                name="moneda"
                value={form.moneda}
                onChange={handleChange}
                required
              >
                <option value="">Seleccione moneda</option>
                <option value="CRC">CRC - Colones</option>
                <option value="USD">USD - Dólares</option>
              </select>
            </div>

            <div>
              <label>Monto:</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
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

            {error && (
              <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>
            )}
          </form>
        </main>
      </div>
    </section>
  );
};

export default Transferencias;
