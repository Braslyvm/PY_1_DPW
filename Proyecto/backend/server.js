/* cd "C:\Users\MSI Stealth Studio\Desktop\Cursos 2025 s2\Desarrollo web\PY_1_DPW\Proyecto"
   npm run backend */

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

// ================= Registro de usuario =================
app.post("/api/registro", (req, res) => {
  const usuario = req.body;
  let usuarios = [];

  try {
    if (fs.existsSync(FILE_PATH)) {
      const data = fs.readFileSync(FILE_PATH, "utf-8");
      usuarios = JSON.parse(data);
    }

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
      if (u.username?.toString().trim().toLowerCase() === usernameNorm)
        conflicts.username = "El username ya está en uso.";
      if (u.correo?.toString().trim().toLowerCase() === correoNorm)
        conflicts.correo = "El correo ya está en uso.";
      if (u.numeroDocumento?.toString().trim() === numeroDocumento)
        conflicts.numeroDocumento = "El número de documento ya está en uso.";
      if (
        u.telefono?.toString().trim() === telefono ||
        u.numeroCelular?.toString().trim() === telefono
      )
        conflicts.telefono = "El número de teléfono ya está en uso.";
    });

    if (Object.keys(conflicts).length > 0) {
      return res
        .status(409)
        .json({ mensaje: "Este usuario ya existe", conflicts });
    }

    // Inicializar campos de cuentas y tarjetas si no existen
    if (!usuario.cuentas) usuario.cuentas = [];
    if (!usuario.tarjetas) usuario.tarjetas = [];

    usuarios.push(usuario);
    fs.writeFileSync(FILE_PATH, JSON.stringify(usuarios, null, 2));
    res.json({ mensaje: "Usuario registrado exitosamente" });
  } catch (err) {
    console.error("Error manejando registro:", err);
    res.status(500).json({ mensaje: "Error interno al registrar usuario" });
  }
});

// ================= Listar usuarios =================
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

// ================= Login =================
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
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

// ================= Endpoints adicionales =================

// Obtener cuentas de un usuario
app.get("/api/usuarios/:username/cuentas", (req, res) => {
  const { username } = req.params;
  try {
    if (!fs.existsSync(FILE_PATH)) return res.status(404).json([]);
    const usuarios = JSON.parse(fs.readFileSync(FILE_PATH, "utf-8"));
    const user = usuarios.find((u) => u.username === username);
    if (!user)
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    res.json(user.cuentas || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: "Error interno" });
  }
});

// Obtener tarjetas de un usuario
app.get("/api/usuarios/:username/tarjetas", (req, res) => {
  const { username } = req.params;
  try {
    if (!fs.existsSync(FILE_PATH)) return res.status(404).json([]);
    const usuarios = JSON.parse(fs.readFileSync(FILE_PATH, "utf-8"));
    const user = usuarios.find((u) => u.username === username);
    if (!user)
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    res.json(user.tarjetas || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: "Error interno" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
