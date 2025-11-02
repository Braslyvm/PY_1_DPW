import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import pkg from "pg";
import { fileURLToPath } from "url";
import path from "path";

const { Pool } = pkg;
const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl: false
});


pool.on("connect", () => console.log("✅ Conectado a PostgreSQL"));

const app = express();
app.use(express.json());

const allowedOrigins = [
  "https://banconsfms.netlify.app",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
    credentials: true,
  })
);


// --- Verificar API Key ---
const verifyApiKey = (req, res, next) => {
  const apiKey = (req.headers["x-api-key"] || "").trim();
  const expectedKey = (process.env.API_KEY || "").trim();

  if (!apiKey)
    return res.status(401).json({ mensaje: "Falta API Key en los encabezados" });

  if (apiKey !== expectedKey)
    return res.status(403).json({ mensaje: "API Key inválida" });

  next();
};

// --- Verificar JWT ---
const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader)
    return res.status(401).json({ mensaje: "Falta token de autenticación" });

  const token = authHeader.split(" ")[1];
  if (!token)
    return res.status(401).json({ mensaje: "Token no proporcionado" });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ mensaje: "Token inválido o expirado" });
    req.user = decoded; // Guarda los datos del usuario autenticado
    next();
  });
};

// ======================================================
// ENDPOINTS
// ======================================================

// --- Inicio ---
app.get("/", (req, res) => {
  res.json({ mensaje: "🚀 API Banco NSFMS activa y protegida con JWT + API Key" });
});


// ========== 1. AUTENTICACIÓN Y OTP ==========

// genera JWT
app.post("/api/v1/auth/login", verifyApiKey, async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM sp_auth_user_get_by_username_or_email($1, $2)", [username, password]);
    const user = result.rows[0];
    if (!user || !user.valido)
      return res.status(401).json({ mensaje: "Credenciales incorrectas" });

    const token = jwt.sign(
      { userId: user.numero_documento, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.json({ mensaje: "Login exitoso", token, rol: user.rol, userId: user.numero_documento });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: "Error en autenticación" });
  }
});


// Genera OTP de recuperación de contraseña
app.post("/api/v1/auth/forgot-password", verifyApiKey, async (req, res) => {
  const { username } = req.body;
  try {
    const user = await pool.query("SELECT numero_documento FROM usuario WHERE username=$1 OR correo=$1", [username]);
    if (!user.rows.length) return res.status(404).json({ mensaje: "Usuario no encontrado" });

    const otp = await pool.query("SELECT sp_otp_create($1, $2) AS codigo", [user.rows[0].numero_documento, 'reset_password']);
    res.json({ mensaje: "OTP generado", codigo: otp.rows[0].codigo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: "Error generando OTP" });
  }
});


// Verifica y consume OTP
app.post("/api/v1/auth/verify-otp", verifyApiKey, async (req, res) => {
  const { userId, codigo, proposito } = req.body;
  try {
    const result = await pool.query("SELECT sp_otp_consume($1, $2, $3) AS valido", [userId, codigo, proposito]);
    res.json({ valido: result.rows[0].valido });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: "Error verificando OTP" });
  }
});


// Resetea contraseña si OTP válido
app.post("/api/v1/auth/reset-password", verifyApiKey, async (req, res) => {
  const { userId, codigo, nuevaContrasena } = req.body;
  try {
    const verif = await pool.query("SELECT sp_otp_consume($1, $2, $3) AS valido", [userId, codigo, 'reset_password']);
    if (!verif.rows[0].valido)
      return res.status(400).json({ mensaje: "OTP inválido o expirado" });

    const hash = await bcrypt.hash(nuevaContrasena, 10);
    await pool.query("UPDATE usuario SET contrasena=$1 WHERE numero_documento=$2", [hash, userId]);
    res.json({ mensaje: "Contraseña actualizada exitosamente" });
  } catch (err) {
    console.error("Error en login:", err);
    res.status(500).json({ mensaje: "Error interno en el inicio de sesión" });
  }
});

// --- Endpoint protegido con JWT ---
app.get("/api/v1/users/perfil", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT numero_documento, nombre, apellido1, apellido2, correo, rol FROM usuario WHERE numero_documento = $1",
      [req.user.userId]
    );
    if (!result.rows.length)
      return res.status(404).json({ mensaje: "Usuario no encontrado" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error obteniendo perfil:", err);
    res.status(500).json({ mensaje: "Error interno" });
  }
});

// --- Endpoint solo para administradores ---
app.get("/api/v1/users", verifyToken, async (req, res) => {
  if (req.user.rol !== 1)
    return res.status(403).json({ mensaje: "Acceso denegado: Solo admin" });

  try {
    const result = await pool.query("SELECT numero_documento, nombre, correo, rol FROM usuario ORDER BY numero_documento");
    res.json(result.rows);
  } catch (err) {
    console.error("Error al listar usuarios:", err);
    res.status(500).json({ mensaje: "Error interno" });
  }
});

// ======================================================
// ❌ ERROR 404
// ======================================================
app.use((req, res) => {
  res.status(404).json({ mensaje: "Ruta no encontrada" });
});

// ======================================================
// 🚀 INICIAR SERVIDOR
// ======================================================
const PORT = process.env.PORT || 4000;
console.log("🔍 API_KEY del entorno:", process.env.API_KEY);
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
