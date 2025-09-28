/*cd "C:\Users\MSI Stealth Studio\Desktop\Cursos 2025 s2\Desarrollo web\PY_1_DPW\Proyecto"
npm run backend
# este comando debe dejar el proceso en ejecución (no volver al prompt) */

import express from "express";
import fs from "fs";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

const FILE_PATH = path.join(__dirname, "usuarios.json");

/*Registra el usuario */
app.post("/api/registro", (req, res) => {
  const usuario = req.body;
  let usuarios = [];
  try {
    if (fs.existsSync(FILE_PATH)) {
      const data = fs.readFileSync(FILE_PATH, "utf-8");
      usuarios = JSON.parse(data);
    }

    // Normalizar valores para comparación
    const usernameNorm = (usuario.username || "")
      .toString()
      .trim()
      .toLowerCase();
    const correoNorm = (usuario.correo || "").toString().trim().toLowerCase();
    const numeroDocumento = (usuario.numeroDocumento || "").toString().trim();
    const telefono = (usuario.telefono || usuario.numeroCelular || "")
      .toString()
      .trim();

    const conflicts = {};
    usuarios.forEach((u) => {
      if (
        u.username &&
        u.username.toString().trim().toLowerCase() === usernameNorm
      ) {
        conflicts.username = "El username ya está en uso.";
      }
      if (u.correo && u.correo.toString().trim().toLowerCase() === correoNorm) {
        conflicts.correo = "El correo ya está en uso.";
      }
      if (
        u.numeroDocumento &&
        u.numeroDocumento.toString().trim() === numeroDocumento
      ) {
        conflicts.numeroDocumento = "El número de documento ya está en uso.";
      }
      if (
        (u.telefono && u.telefono.toString().trim() === telefono) ||
        (u.numeroCelular && u.numeroCelular.toString().trim() === telefono)
      ) {
        conflicts.telefono = "El número de teléfono ya está en uso.";
      }
    });

    if (Object.keys(conflicts).length > 0) {
      return res
        .status(409)
        .json({ mensaje: "Este usuario ya existe", conflicts });
    }

    usuarios.push(usuario);
    fs.writeFileSync(FILE_PATH, JSON.stringify(usuarios, null, 2));
    res.json({ mensaje: "Usuario registrado exitosamente" });
  } catch (err) {
    console.error("Error manejando registro:", err);
    res.status(500).json({ mensaje: "Error interno al registrar usuario" });
  }
});

// Devuelve la lista de usuarios
app.get("/api/usuarios", (req, res) => {
  try {
    let usuarios = [];
    if (fs.existsSync(FILE_PATH)) {
      const data = fs.readFileSync(FILE_PATH, "utf-8");
      usuarios = JSON.parse(data);
    }
    res.json(usuarios);
  } catch (err) {
    console.error("Error leyendo usuarios:", err);
    res.status(500).json({ mensaje: "Error interno al leer usuarios" });
  }
});
// Maneja el inicio de sesión de usuarios (autenticación)
app.post("/api/login", (req, res) => {

  const { username, password } = req.body;
  console.log("entra")
  let usuarios = [];
  try {
    if (fs.existsSync(FILE_PATH)) {
      const data = fs.readFileSync(FILE_PATH, "utf-8");
      usuarios = JSON.parse(data);
    }
    const user = usuarios.find(
      (u) => u.username === username && u.password === password
    );
    if (user) {
      res.json({ mensaje: "Inicio de sesión exitoso", user });
    } else {
      res.status(401).json({ mensaje: "Credenciales inválidas" });
    }
  } catch (err) {
    console.error("Error manejando login:", err);
    res.status(500).json({ mensaje: "Error interno al iniciar sesión" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
