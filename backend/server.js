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
    if (err) {
      console.error("❌ Error verificando token:", err.message);
      return res.status(403).json({ mensaje: "Token inválido o expirado" });
    }

    req.user = decoded; // Guardar usuario decodificado
    next();
  });
};

// ======================================================
// ENDPOINTS
// ======================================================

// --- Inicio ---
app.get("/", (req, res) => {
  res.json({
    mensaje: "🚀 API Banco NSFMS activa y protegida con JWT + API Key",
  });
});

// --- Login (autenticación con API Key y generación de JWT) ---
app.post("/api/v1/auth/login", verifyApiKey, async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM usuario WHERE username = $1 OR correo = $1",
      [username]
    );

    const user = result.rows[0];
    if (!user) return res.status(401).json({ mensaje: "Usuario no encontrado" });

    // Verificar contraseña
    const match = await bcrypt.compare(password, user.contrasena);
    if (!match)
      return res.status(401).json({ mensaje: "Contraseña incorrecta" });

    // Crear token JWT
    const token = jwt.sign(
      { userId: user.numero_documento, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      mensaje: "Inicio de sesión exitoso",
      token,
      rol: user.rol,
      userId: user.numero_documento,
    });
  } catch (err) {
    console.error("❌ Error en login:", err);
    res.status(500).json({ mensaje: "Error interno en el inicio de sesión" });
  }
});

// --- Perfil de usuario (requiere JWT) ---
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
    console.error("❌ Error obteniendo perfil:", err);
    res.status(500).json({ mensaje: "Error interno" });
  }
});

// --- Listado de usuarios (solo admin) ---
app.get("/api/v1/users", verifyToken, async (req, res) => {
  if (req.user.rol !== 1)
    return res.status(403).json({ mensaje: "Acceso denegado: Solo admin" });

  try {
    const result = await pool.query(
      "SELECT numero_documento, nombre, correo, rol FROM usuario ORDER BY numero_documento"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error al listar usuarios:", err);
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
const PORT = process.env.PORT || 8080;
console.log("🔍 API_KEY del entorno:", process.env.API_KEY);
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en puerto ${PORT}`);
});
