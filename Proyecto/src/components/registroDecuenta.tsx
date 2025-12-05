import React, { FC } from "react";
import Swal from "sweetalert2";
import { apiFetch } from "../config/Conectar";

interface RegistroDeCuentaProps {
  setActiveTab: (tab: string) => void;
}

const RegistroDeCuenta: FC<RegistroDeCuentaProps> = ({ setActiveTab }) => {
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const tipo = formData.get("tipo") as string;  
    const moneda = formData.get("moneda") as string; 
    const saldoStr = formData.get("saldo") as string;

    const saldo = parseFloat(saldoStr);
    if (!tipo || !moneda || isNaN(saldo) || saldo < 0) {
      Swal.fire({
        icon: "warning",
        title: "Datos incompletos o inválidos",
        text: "Verifique el IBAN, tipo de cuenta, moneda y saldo inicial.",
      });
      return;
    }

    const tipoId = parseInt(tipo, 10);   
    const monedaId = parseInt(moneda, 10);  

    const tipoLabel =
      tipoId === 2 ? "Corriente" : tipoId === 3 ? "Crédito" : "Desconocido";
    const monedaLabel = monedaId === 1 ? "CRC" : "USD";
    try {
      await apiFetch("/api/v1/accounts", {
        method: "POST",
        auth: true,
        body: JSON.stringify({
          tipo: tipoId,      
          moneda: monedaId,  
          saldo,
        }),
      });

      Swal.fire({
        title: "Cuenta registrada ✅",
        html: `
          <p><b>Tipo:</b> ${tipoLabel}</p>
          <p><b>Moneda:</b> ${monedaLabel}</p>
          <p><b>Saldo inicial:</b> ${saldo.toFixed(2)}</p>
        `,
        icon: "success",
        confirmButtonText: "Aceptar",
      }).then(() => {
        form.reset();
        setActiveTab("cuentas");
      });
    } catch (error: any) {
      console.error("Error creando cuenta:", error);
      Swal.fire({
        icon: "error",
        title: "Error al registrar la cuenta",
        text: error.message || "No se pudo registrar la cuenta.",
      });
    }
  };

  return (
    <section className="contenedor_main">
      <div className="registrarcuenta-form-wrapper">
        <header className="registrarcuenta-header">
          <h2>Registro de Cuenta</h2>
          <p>Complete la información para registrar una nueva cuenta bancaria</p>
        </header>
        <main>
          <form className="registrarcuenta-form" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="tipo">Tipo de Cuenta:</label>
              <select id="tipo" name="tipo" required>
                <option value="">Seleccione</option>
                <option value="2">Corriente</option>
                <option value="3">Crédito</option>
              </select>
            </div>
            <div>
              <label htmlFor="moneda">Moneda:</label>
              <select id="moneda" name="moneda" required>
                <option value="">Seleccione</option>
                <option value="1">CRC</option>
                <option value="2">USD</option>
              </select>
            </div>
            <div>
              <label htmlFor="saldo">Saldo Inicial:</label>
              <input
                type="number"
                id="saldo"
                name="saldo"
                required
                step="0.01"
                min="0"
                placeholder="1523400.50"
              />
            </div>
            <div className="registrarcuenta-buttons">
              <button type="submit">Registrar Cuenta</button>
              <button type="button" onClick={() => setActiveTab("cuentas")}>
                Cancelar
              </button>
            </div>
          </form>
        </main>
      </div>
    </section>
  );
};

export default RegistroDeCuenta;
