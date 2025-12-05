import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import pkg from "pg";
import { fileURLToPath } from "url";
import path from "path";
import dotenv from "dotenv";


dotenv.config(); 
const { Pool } = pkg;
const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl: false
});


pool.on("connect", () => console.log(" Conectado a PostgreSQL"));

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
// ================== ENDPOINTS =========================
// ======================================================

// --- Inicio ---
app.get("/", (req, res) => {
  res.json({ mensaje: " API Banco NSFMS activa y protegida con JWT + API Key" });
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
    console.error(err);
    res.status(500).json({ mensaje: "Error reseteando contraseña" });
  }
});

// ========== 2. USUARIOS ==========

app.post("/api/v1/users", async (req, res) => {
  const { numero_documento, tipo_identificacion, nombre, apellido1, apellido2,
          username, fecha_nacimiento, correo, telefono, contrasena, rol } = req.body;

  try {
    await pool.query(
      "CALL insert_usuario($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
      [numero_documento, tipo_identificacion, nombre, apellido1, apellido2,
       username, fecha_nacimiento, correo, telefono, contrasena, rol]
    );
    res.status(201).json({ mensaje: "Usuario creado exitosamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: "Error creando usuario" });
  }
});

//  Consulta usuario
app.get("/api/v1/users/:id", verifyToken, async (req, res) => {
  const id = req.params.id;
  if (req.user.rol !== 1 && req.user.userId != id)
    return res.status(403).json({ mensaje: "Acceso denegado" });
  try {
    const result = await pool.query("SELECT * FROM select_usuario($1)", [id]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: "Error consultando usuario" });
  }
});

// Actualiza usuario (solo admin)
app.put("/api/v1/users/:id", verifyToken, async (req, res) => {

  if (req.user.rol !== 1)
    return res.status(403).json({ mensaje: "Solo administradores pueden actualizar" });

  const { id } = req.params; 
  const { nombre, apellido1, correo, telefono } = req.body;

  
  if (!nombre || !apellido1 || !correo)
    return res.status(400).json({ mensaje: "Faltan datos obligatorios para actualizar" });

  try {

    await pool.query("CALL update_usuario($1,$2,$3,$4,$5)", [
      id, nombre, apellido1, correo, telefono
    ]);

    res.json({ mensaje: "Usuario actualizado correctamente" });
  } catch (err) {
    console.error("❌ Error en update_usuario:", err);
    res.status(500).json({ mensaje: "Error actualizando usuario" });
  }
});

// Elimina usuario
app.delete("/api/v1/users/:id", verifyToken, async (req, res) => {
  if (req.user.rol !== 1)
    return res.status(403).json({ mensaje: "Solo administradores pueden eliminar" });
  try {
    await pool.query("CALL delete_usuario($1)", [req.params.id]);
    res.json({ mensaje: "Usuario eliminado correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: "Error eliminando usuario" });
  }
});

// ========== 3. CUENTAS ==========

//Crea cuenta
app.post("/api/v1/accounts", verifyToken, async (req, res) => {
  const { account_id, tipo, moneda, saldo, estado } = req.body;
  try {
    await pool.query("CALL insert_cuenta($1,$2,$3,$4,$5,$6)", [account_id, req.user.userId, tipo, moneda, saldo, estado]);
    res.status(201).json({ mensaje: "Cuenta creada correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: "Error creando cuenta" });
  }
});

//  Lista cuentas de usuario
app.get("/api/v1/accounts", verifyToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM select_cuenta($1)", [req.user.userId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: "Error listando cuentas" });
  }
});

// Detalle cuenta
app.get("/api/v1/accounts/:id", verifyToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM select_cuenta(NULL, NULL)");
    const cuenta = result.rows.find(c => c.account_id === req.params.id);
    if (!cuenta) return res.status(404).json({ mensaje: "Cuenta no encontrada" });
    if (req.user.rol !== 1 && cuenta.usuario_documento !== req.user.userId)
      return res.status(403).json({ mensaje: "No autorizado" });
    res.json(cuenta);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: "Error consultando cuenta" });
  }
});

// Cambiar estado
app.post("/api/v1/accounts/:accountId/status", verifyToken, async (req, res) => {
  if (req.user.rol !== 1)
    return res.status(403).json({ mensaje: "Solo admin puede cambiar estado" });
  const { nuevo_estado } = req.body;
  try {
    await pool.query("CALL sp_accounts_set_status($1,$2)", [req.params.accountId, nuevo_estado]);
    res.json({ mensaje: "Estado de cuenta actualizado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: "Error cambiando estado" });
  }
});

// Listar movimientos
app.get("/api/v1/accounts/:accountId/movements", verifyToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM select_movimiento_cuenta(NULL,$1,NULL,NULL)", [req.params.accountId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: "Error listando movimientos" });
  }
});

// ========== 4. TRANSFERENCIAS ==========
app.post("/api/v1/transfers/internal", verifyToken, async (req, res) => {
  const { origen, destino, tipo_mov, moneda, monto, descripcion } = req.body;
  try {
    await pool.query("CALL cuenta_transferir($1,$2,$3,$4,$5,$6)", [origen, destino, tipo_mov, moneda, monto, descripcion]);
    res.json({ mensaje: "Transferencia realizada correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: "Error realizando transferencia" });
  }
});

// ========== 5. TARJETAS ==========
app.post("/api/v1/cards", verifyToken, async (req, res) => {
  const { card_id, cuenta_id, tipo, numero_tarjeta, exp, moneda, limite } = req.body;
  try {
    await pool.query("CALL insert_tarjeta($1,$2,$3,$4,$5,$6,$7,$8,0,NULL,NULL)", [
      card_id, req.user.userId, cuenta_id, tipo, numero_tarjeta, exp, moneda, limite
    ]);
    res.status(201).json({ mensaje: "Tarjeta creada" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: "Error creando tarjeta" });
  }
});

app.get("/api/v1/cards", verifyToken, async (req, res) => {
  const result = await pool.query("SELECT * FROM select_tarjeta($1)", [req.user.userId]);
  res.json(result.rows);
});

app.get("/api/v1/cards/:cardId", verifyToken, async (req, res) => {
  const result = await pool.query("SELECT * FROM select_tarjeta(NULL,$1)", [req.params.cardId]);
  const card = result.rows[0];
  if (!card) return res.status(404).json({ mensaje: "Tarjeta no encontrada" });
  if (req.user.rol !== 1 && card.usuario_documento !== req.user.userId)
    return res.status(403).json({ mensaje: "No autorizado" });
  res.json(card);
});

// Movimientos de tarjeta
app.get("/api/v1/cards/:cardId/movements", verifyToken, async (req, res) => {
  const result = await pool.query("SELECT * FROM sp_card_movements_list($1)", [req.params.cardId]);
  res.json(result.rows);
});

// Insertar movimiento de tarjeta
app.post("/api/v1/cards/:cardId/movements", verifyToken, async (req, res) => {
  const { tipo, moneda, monto, descripcion } = req.body;
  await pool.query("CALL sp_card_movement_add($1,$2,$3,$4,$5)", [req.params.cardId, tipo, moneda, monto, descripcion]);
  res.json({ mensaje: "Movimiento agregado" });
});

// OTP para ver PIN/CVV
app.post("/api/v1/cards/:cardId/otp", verifyToken, async (req, res) => {
  const otp = await pool.query("SELECT sp_otp_create($1,$2) AS codigo", [req.user.userId, 'view_cvv']);
  res.json({ codigo: otp.rows[0].codigo });
});

// Ver detalles tras OTP
app.post("/api/v1/cards/:cardId/view-details", verifyToken, async (req, res) => {
  const { codigo } = req.body;
  const verif = await pool.query("SELECT sp_otp_consume($1,$2,$3) AS valido", [req.user.userId, codigo, 'view_cvv']);
  if (!verif.rows[0].valido)
    return res.status(400).json({ mensaje: "OTP inválido" });
  res.json({ mensaje: "Acceso temporal concedido" });
});

// ========== 6. VALIDAR CUENTA ==========
app.post("/api/v1/bank/validate-account", async (req, res) => {
  console.log(">>> Entró a /api/v1/bank/validate-account");
  console.log("Headers recibidos:", req.headers);

  try {
    // 1) Autenticación por X-API-TOKEN
    const token = req.header("X-API-TOKEN");

    if (!token) {
      return res.status(401).json({
        error: "UNAUTHORIZED",
        message: "Falta header X-API-TOKEN",
      });
    }

    const expectedToken =
      process.env.BANK_CENTRAL_TOKEN || "BANK-CENTRAL-IC8057-2025";

    if (token !== expectedToken) {
      return res.status(401).json({
        error: "UNAUTHORIZED",
        message: "Token inválido en X-API-TOKEN",
      });
    }// 2) Validar body { iban }
const { iban } = req.body || {};

if (!iban) {
  return res.status(400).json({
    error: "INVALID_ACCOUNT_FORMAT",
    message: "El campo 'iban' es obligatorio.",
  });
}

// Normalizamos (sin espacios ni guiones)
const normalized = iban.replace(/[\s-]/g, "");

// Validar formato IBAN del proyecto
if (!isValidCostaRicaIban(normalized)) {
  return res.status(400).json({
    error: "INVALID_ACCOUNT_FORMAT",
    message: "El formato del iban no es válido.",
  });
}


    // Extraer código de banco: CR01 B0X NNNNNNNNNNNN
    const match = /^CR01B0([1-8])[0-9]{12}$/.exec(normalized);
    const bancoDestino = match ? match[1] : null; // "1".."8"

    if (bancoDestino !== "7") {
      // IBAN válido pero NO pertenece a Banco NSFM
      return res.status(200).json({
        exists: false,
        info: null,
      });
    }

    // 3) Consultar la BD SOLO si es B07
    const { rows } = await pool.query(
      "SELECT * FROM sp_bank_validate_account($1)",
      [normalized] 
    );

    // Si no hay filas o existe = false → exists = false, info = null
    if (!rows.length || !rows[0].existe) {
      return res.status(200).json({
        exists: false,
        info: null,
      });
    }

    const cuenta = rows[0];

    // 4) Respuesta estándar de éxito (contrato del proyecto)
    return res.status(200).json({
      exists: true,
      info: {
        name: cuenta.nombre,
        identification: cuenta.identificacion,
        currency: cuenta.moneda, // "CRC" o "USD"
        debit: cuenta.permite_debito,
        credit: cuenta.permite_credito,
      },
    });
  } catch (err) {
    console.error("Error en /api/v1/bank/validate-account:", err);
    return res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Error interno al validar la cuenta.",
    });
  }
});


const isValidCostaRicaIban = (iban) => {
  if (typeof iban !== "string") return false;

  const normalized = iban.replace(/[\s-]/g, "");

  const regex = /^CR01B0[1-8][0-9]{12}$/;

  return regex.test(normalized);
};




app.use((req, res) => {
  res.status(404).json({ mensaje: "Ruta no encontrada" });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(` Servidor corriendo en http://localhost:${PORT}`);
});