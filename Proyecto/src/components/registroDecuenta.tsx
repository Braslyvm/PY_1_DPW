import React, { FC } from "react";
import Swal from "sweetalert2";

interface RegistroDeCuentaProps {
  setActiveTab: (tab: string) => void;
}

const RegistroDeCuenta: FC<RegistroDeCuentaProps> = ({ setActiveTab }) => {
  // Manejo del envío del formulario
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (validateForm()) {
      const formData = new FormData(event.currentTarget);

      const nuevaCuenta = {
        account_id: formData.get("account_id") as string,
        alias: formData.get("alias") as string,
        tipo: formData.get("tipo") as string,
        moneda: formData.get("moneda") as string,
        saldo: parseFloat(formData.get("saldo") as string),
      };

      // Guardar en localStorage (array de cuentas)
      const cuentasGuardadas = JSON.parse(
        localStorage.getItem("cuentas") || "[]"
      );
      cuentasGuardadas.push(nuevaCuenta);
      localStorage.setItem("cuentas", JSON.stringify(cuentasGuardadas));

      // Mostrar confirmación con Swal
      Swal.fire({
        title: "Cuenta registrada ✅",
        html: `
          <p><b>Número de cuenta (IBAN):</b> ${nuevaCuenta.account_id}</p>
          <p><b>Alias:</b> ${nuevaCuenta.alias}</p>
          <p><b>Tipo:</b> ${nuevaCuenta.tipo}</p>
          <p><b>Moneda:</b> ${nuevaCuenta.moneda}</p>
          <p><b>Saldo inicial:</b> ${nuevaCuenta.saldo.toFixed(2)}</p>
        `,
        icon: "success",
        confirmButtonText: "Aceptar",
      }).then(() => {
        // Volver a la lista de cuentas
        setActiveTab("cuentas");
      });
    }
  };

  // Validaciones (puedes agregar más aquí)
  const validateForm = () => {
    return true;
  };

  return (
    <section className="contenedor_main">
      <div className="registrarcuenta-form-wrapper">
        <header className="registrarcuenta-header">
          <h2>Registro de Cuenta</h2>
          <p>
            Complete la información para registrar una nueva cuenta bancaria
          </p>
        </header>
        <main>
          <form className="registrarcuenta-form" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="account_id">Identificador (IBAN):</label>
              <input
                type="text"
                id="account_id"
                name="account_id"
                required
                pattern="^CR01-\d{4}-\d{4}-\d{12}$"
                placeholder="CR01-1234-5678-123456789012"
              />
            </div>
            <div>
              <label htmlFor="alias">Alias:</label>
              <input
                type="text"
                id="alias"
                name="alias"
                required
                placeholder="Ahorros Principal"
              />
            </div>
            <div>
              <label htmlFor="tipo">Tipo de Cuenta:</label>
              <select id="tipo" name="tipo" required>
                <option value="">Seleccione</option>
                <option value="Ahorro">Ahorro</option>
                <option value="Corriente">Corriente</option>
                <option value="Credito">Crédito</option>
              </select>
            </div>
            <div>
              <label htmlFor="moneda">Moneda:</label>
              <select id="moneda" name="moneda" required>
                <option value="">Seleccione</option>
                <option value="CRC">CRC</option>
                <option value="USD">USD</option>
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
