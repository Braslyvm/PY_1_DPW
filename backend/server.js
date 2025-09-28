import express from "express";
import fs from "fs";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// ====== Definir __dirname para ESM ======
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ====== Rutas a archivos JSON ======
const FILE_PATH = path.join(__dirname, "usuarios.json");
const DETALLES_CUENTAS_PATH = path.join(__dirname, "detallesCuenta.json");

const app = express();
app.use(cors());
app.use(express.json());

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
      if (
        u.username &&
        u.username.toString().trim().toLowerCase() === usernameNorm
      )
        conflicts.username = "El username ya está en uso.";
      if (u.correo && u.correo.toString().trim().toLowerCase() === correoNorm)
        conflicts.correo = "El correo ya está en uso.";
      if (
        u.numeroDocumento &&
        u.numeroDocumento.toString().trim() === numeroDocumento
      )
        conflicts.numeroDocumento = "El número de documento ya está en uso.";
      if (
        (u.telefono && u.telefono.toString().trim() === telefono) ||
        (u.numeroCelular && u.numeroCelular.toString().trim() === telefono)
      )
        conflicts.telefono = "El número de teléfono ya está en uso.";
    });

    if (Object.keys(conflicts).length > 0) {
      return res
        .status(409)
        .json({ mensaje: "Este usuario ya existe", conflicts });
    }

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
      usuarios = JSON.parse(fs.readFileSync(FILE_PATH, "utf-8"));
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

  try {
    let usuarios = [];
    if (fs.existsSync(FILE_PATH)) {
      usuarios = JSON.parse(fs.readFileSync(FILE_PATH, "utf-8"));
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

// ================= Obtener cuentas de un usuario =================
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

// ================= Obtener tarjetas de un usuario =================
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

// ================= Obtener movimientos de cuenta =================
app.get("/api/cuentas/:accountId", (req, res) => {
  const { accountId } = req.params;
  console.log("Buscando cuenta:", accountId);

  try {
    if (!fs.existsSync(DETALLES_CUENTAS_PATH)) {
      console.log("Archivo no encontrado:", DETALLES_CUENTAS_PATH);
      return res
        .status(404)
        .json({ mensaje: "Archivo de detalles no encontrado" });
    }

    const detalles = JSON.parse(
      fs.readFileSync(DETALLES_CUENTAS_PATH, "utf-8")
    );
    console.log("Archivo leído, número de cuentas:", detalles.length);

    const cuenta = detalles.find((c) => c.account_id === accountId);

    if (!cuenta) {
      console.log("Cuenta no encontrada:", accountId);
      return res.status(404).json({ mensaje: "Cuenta no encontrada" });
    }

    console.log("Cuenta encontrada:", cuenta.account_id);
    res.json(cuenta);
  } catch (err) {
    console.error("Error leyendo detalles de cuentas:", err);
    res.status(500).json({ mensaje: "Error interno" });
  }
});

// ================= Servidor =================
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
