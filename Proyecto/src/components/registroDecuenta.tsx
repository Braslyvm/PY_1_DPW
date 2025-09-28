import React from "react";
import type { FC } from "react";
import { useNavigate } from "react-router-dom";
const RegistroDeCuenta: FC = () => {
  const navigate = useNavigate();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (validateForm()) {
      alert("Cuenta registrada exitosamente.");
      navigate("/dashboard");
    }

  };
  const validateForm = () => {
    

    return true;
    
  };

  return (
    <section>
      <header>
        <h2>Registro de Cuenta</h2>
      </header>
      <main>
        <form>
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
          <button type="submit">Registrar Cuenta</button>
          <button type="button" onClick={() => navigate("/dashboard")}>
            Cancelar
          </button>
        </form>
      </main>
    </section>
  );
};
export default RegistroDeCuenta;
