import React from "react";
import { useNavigate } from "react-router-dom";

const Registro: React.FC = () => {
  const navigate = useNavigate();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/dashboard");
    

 const 
  return <>
    <div className="register-container" style={{ backgroundColor: "#7c7b7bff" }}>
      <h1>Registro de Usuario</h1>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Nombre" required />
        <select name="tipoDocumento" id="tipoDocumento" required>
          <option value="">Seleccione tipo de documento</option>
          <option value="cedula">Cédula</option>
          <option value="dimex">DIMEX</option>
        </select>
        {/*condicionalmente segun el tipo de documento cambia el input*/}
        <input type="text" placeholder="Número de Documento" required />
       
       
        <input type="email" placeholder="Correo Electrónico" required />
        <input type="password" placeholder="Contraseña" required />
        <button type="submit">Registrar</button>
      </form>
    </div>
  </>;

};

  export default Registro;