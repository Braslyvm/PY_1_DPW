import React, { FC } from "react";

interface RegistroDeCuentaProps {
  setActiveTab: (tab: string) => void;
}

const RegistroDeCuenta: FC<RegistroDeCuentaProps> = ({ setActiveTab }) => {
  // Función para manejar el envío del formulario
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (validateForm()) {
      alert("Cuenta registrada exitosamente.");
      // Volver a la lista de cuentas después de registrar
      setActiveTab("cuentas");
    }
  };

  // Función para validar el formulario
  const validateForm = () => {
    // Aquí puedes agregar validaciones personalizadas
    return true;
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
          <div>
            <label htmlFor="propietario">Propietario (customer_id):</label>
            <input
              type="text"
              id="propietario"
              name="propietario"
              required
              placeholder="customer_id del usuario"
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
