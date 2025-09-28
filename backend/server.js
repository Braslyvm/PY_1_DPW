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

// ====== Configuración CORS ======
const allowedOrigins = [
  "https://banconsfms.netlify.app",
  "http://localhost:5173"
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.use(express.json());

// ================= Registro de usuario =================
app.post("/api/registro", (req, res) => {
  const usuario = req.body;
  let usuarios = [];

  try {
    if (fs.existsSync(FILE_PATH)) {
      usuarios = JSON.parse(fs.readFileSync(FILE_PATH, "utf-8"));
    }

    const usernameNorm = (usuario.username || "").trim().toLowerCase();
    const correoNorm = (usuario.correo || "").trim().toLowerCase();
    const numeroDocumento = (usuario.numeroDocumento || "").trim();
    const telefono = (usuario.telefono || usuario.numeroCelular || "").trim();

    const conflicts = {};
    usuarios.forEach((u) => {
      if (u.username && u.username.trim().toLowerCase() === usernameNorm)
        conflicts.username = "El username ya está en uso.";
      if (u.correo && u.correo.trim().toLowerCase() === correoNorm)
        conflicts.correo = "El correo ya está en uso.";
      if (u.numeroDocumento && u.numeroDocumento.trim() === numeroDocumento)
        conflicts.numeroDocumento = "El número de documento ya está en uso.";
      if ((u.telefono && u.telefono.trim() === telefono) ||
          (u.numeroCelular && u.numeroCelular.trim() === telefono))
        conflicts.telefono = "El número de teléfono ya está en uso.";
    });

    if (Object.keys(conflicts).length > 0) {
      return res.status(409).json({ mensaje: "Este usuario ya existe", conflicts });
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
    if (!user) return res.status(404).json({ mensaje: "Usuario no encontrado" });
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
    if (!user) return res.status(404).json({ mensaje: "Usuario no encontrado" });
    res.json(user.tarjetas || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: "Error interno" });
  }
});

// ================= Obtener movimientos de cuenta =================
app.get("/api/cuentas/:accountId", (req, res) => {
  const { accountId } = req.params;

  try {
    if (!fs.existsSync(DETALLES_CUENTAS_PATH)) {
      return res.status(404).json({ mensaje: "Archivo de detalles no encontrado" });
    }

    const detalles = JSON.parse(fs.readFileSync(DETALLES_CUENTAS_PATH, "utf-8"));
    const cuenta = detalles.find((c) => c.account_id === accountId);

    if (!cuenta) return res.status(404).json({ mensaje: "Cuenta no encontrada" });

    res.json(cuenta);
  } catch (err) {
    console.error("Error leyendo detalles de cuentas:", err);
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

// ================= Obtener movimientos de tarjeta =================
const DETALLES_TARJETAS_PATH = path.join(__dirname, "detalleesTarjetas.json");

app.get("/api/tarjetas/:cardId", (req, res) => {
  const { cardId } = req.params;
  console.log("Buscando tarjeta:", cardId);

  try {
    if (!fs.existsSync(DETALLES_TARJETAS_PATH)) {
      console.log("Archivo no encontrado:", DETALLES_TARJETAS_PATH);
      return res
        .status(404)
        .json({ mensaje: "Archivo de detalles de tarjetas no encontrado" });
    }

    const detalles = JSON.parse(
      fs.readFileSync(DETALLES_TARJETAS_PATH, "utf-8")
    );
    console.log("Archivo leído, número de tarjetas:", detalles.length);

    const tarjeta = detalles.find((t) => t.card_id === cardId);

    if (!tarjeta) {
      console.log("Tarjeta no encontrada:", cardId);
      return res.status(404).json({ mensaje: "Tarjeta no encontrada" });
    }

    console.log("Tarjeta encontrada:", tarjeta.card_id);
    res.json(tarjeta);
  } catch (err) {
    console.error("Error leyendo detalles de tarjetas:", err);
    res.status(500).json({ mensaje: "Error interno" });
  }
});

// ================= Middleware 404 =================
app.use((req, res) => {
  res.status(404).json({ mensaje: "Ruta no encontrada" });
});

// ================= Servidor =================
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
