import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import pkg from "pg";
import { fileURLToPath } from "url";
import path from "path";
import dotenv from "dotenv";
import { io } from "socket.io-client";


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
  const {tipo, moneda, saldo } = req.body;
  try {
    await pool.query("CALL insert_cuenta($1,$2,$3,$4)", [req.user.userId, tipo, moneda, saldo]);
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
    }

    // 2) Validar body { iban }
    const { iban } = req.body || {};

    if (!iban) {
      return res.status(400).json({
        error: "INVALID_ACCOUNT_FORMAT",
        message: "El campo 'iban' es obligatorio.",
      });
    }


    const normalized = iban.replace(/[\s-]/g, "").toUpperCase();

    if (!isValidCostaRicaIban(normalized)) {
      return res.status(400).json({
        error: "INVALID_ACCOUNT_FORMAT",
        message: "El formato del iban no es válido.",
      });
    }


    const match = /^CR01B0([1-8])[0-9]{12}$/.exec(normalized);
    const bancoDestino = match ? match[1] : null; // "1".."8"

    if (bancoDestino !== "7") {

      return res.status(200).json({
        exists: false,
        info: null,
      });
    }


    const { rows } = await pool.query(
      "SELECT * FROM sp_bank_validate_account($1)",
      [normalized] 
    );

    if (!rows.length || !rows[0].existe) {
      return res.status(200).json({
        exists: false,
        info: null,
      });
    }

    const cuenta = rows[0];

   
    return res.status(200).json({
      exists: true,
      info: {
        name: cuenta.nombre,
        identification: cuenta.identificacion,
        currency: cuenta.moneda,
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


const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(` Servidor corriendo en http://localhost:${PORT}`);
});


//-----------------------------------------------------------------------------------------
//---------------------- WEB SOCKETS BANCO CENTRAL + TRANSFERENCIAS INTERBANCARIAS -------
//-----------------------------------------------------------------------------------------

// =================== BANCO CENTRAL (WebSocket) ===================

const CENTRAL_WS_URL = "http://137.184.36.3:6000";

const centralSocket = io(CENTRAL_WS_URL, {
  transports: ["websocket"],
  auth: {
    bankId:  "B07",
    bankName: "Banco NSFM",
    token: "BANK-CENTRAL-IC8057-2025",
  },
});

const pendingTransfers = new Map();

centralSocket.on("connect", () => {
  console.log("✅ Conectado al Banco Central. socket.id =", centralSocket.id);
});

centralSocket.on("disconnect", (reason) => {
  console.log("⚠️ Desconectado del Banco Central. Razón:", reason);
});

centralSocket.on("connect_error", (err) => {
  console.error("❌ Error conectando al Banco Central:", err.message);
});

centralSocket.on("message", async (msg) => {
  const { type, data } = msg || {};
  console.log("WS recibido:", type, data);

  try {
    switch (type) {
      case "transfer.reserve":
        await handleTransferReserve(data);
        break;

      case "transfer.credit":
        await handleTransferCredit(data);
        break;

      case "transfer.debit":
        await handleTransferDebit(data);
        break;

      case "transfer.rollback":
        await handleTransferRollback(data);
        break;

      case "transfer.commit":
        resolveTransferPromise(data.id, { ok: true });
        break;

      case "transfer.reject":
        resolveTransferPromise(data.id, {
          ok: false,
          reason: data.reason,
        });
        break;

      case "transfer.init":
        console.log("transfer.init:", data);
        break;

      default:
        console.log("Tipo de mensaje no manejado:", type);
    }
  } catch (err) {
    console.error("Error manejando mensaje WS:", err);
  }
});
function resolveTransferPromise(id, payload) {
  const entry = pendingTransfers.get(id);
  if (!entry) return;

  try {
    entry.resolve(payload);
  } finally {
    pendingTransfers.delete(id);
  }
}


function sendTransferIntent(payload) {
  if (!centralSocket.connected) {
    throw new Error("No hay conexión con el Banco Central");
  }

  centralSocket.emit("message", {
    type: "transfer.intent",
    data: payload,
  });
}
function waitForTransferResult(id) {
  console.log("Esperando resultado para TX:", id);
  return new Promise((resolve) => {
    console.log("Registrando promesa pendiente para TX:", id);
    pendingTransfers.set(id, { resolve });
  });
}


// =================== HANDLERS DE EVENTOS (lado banco) ===================

async function handleTransferReserve(data) {
  const { id, from, amount } = data;

  try {
    const { rows } = await pool.query(
      "SELECT saldo, moneda, permite_debito FROM cuenta WHERE account_id = $1",
      [from]
    );

    if (!rows.length) {
      return centralSocket.emit("message", {
        type: "transfer.reserve.result",
        data: { id, ok: false, reason: "ACCOUNT_NOT_FOUND" },
      });
    }

    const cuenta = rows[0];

    if (!cuenta.permite_debito) {
      return centralSocket.emit("message", {
        type: "transfer.reserve.result",
        data: { id, ok: false, reason: "ACCOUNT_NO_DEBIT" },
      });
    }

    if (Number(cuenta.saldo) < Number(amount)) {
      return centralSocket.emit("message", {
        type: "transfer.reserve.result",
        data: { id, ok: false, reason: "NO_FUNDS" },
      });
    }

    centralSocket.emit("message", {
      type: "transfer.reserve.result",
      data: { id, ok: true },
    });
  } catch (err) {
    console.error("Error en handleTransferReserve:", err);
    centralSocket.emit("message", {
      type: "transfer.reserve.result",
      data: { id, ok: false, reason: "RESERVE_FAILED" },
    });
  }
}

async function handleTransferCredit(data) {
  const { id, to, amount, currency } = data;

  try {
    const { rows } = await pool.query(
      "SELECT moneda, permite_credito FROM cuenta WHERE account_id = $1",
      [to]
    );

    if (!rows.length) {
      return centralSocket.emit("message", {
        type: "transfer.credit.result",
        data: { id, ok: false, reason: "ACCOUNT_NOT_FOUND" },
      });
    }

    const cuenta = rows[0];

    if (!cuenta.permite_credito) {
      return centralSocket.emit("message", {
        type: "transfer.credit.result",
        data: { id, ok: false, reason: "ACCOUNT_NO_CREDIT" },
      });
    }

    if (cuenta.moneda !== currency) {
      return centralSocket.emit("message", {
        type: "transfer.credit.result",
        data: { id, ok: false, reason: "CURRENCY_NOT_SUPPORTED" },
      });
    }

    await pool.query(
      "CALL cuenta_depositar($1,$2,$3,$4,$5)",
      [to, 1, cuenta.moneda, amount, "Transferencia interbancaria recibida"]
    );

    centralSocket.emit("message", {
      type: "transfer.credit.result",
      data: { id, ok: true },
    });
  } catch (err) {
    console.error("Error en handleTransferCredit:", err);
    centralSocket.emit("message", {
      type: "transfer.credit.result",
      data: { id, ok: false, reason: "CREDIT_FAILED" },
    });
  }
}

async function handleTransferDebit(data) {
  const { id, from, amount } = data;

  try {
    await pool.query(
      "CALL cuenta_retirar($1,$2,$3,$4,$5)",
      [from, 2, 1, amount, "Transferencia interbancaria enviada"]
    );

    centralSocket.emit("message", {
      type: "transfer.debit.result",
      data: { id, ok: true },
    });
  } catch (err) {
    console.error("Error en handleTransferDebit:", err);
    centralSocket.emit("message", {
      type: "transfer.debit.result",
      data: { id, ok: false, reason: "DEBIT_FAILED" },
    });
  }
}

async function handleTransferRollback(data) {
  const { id, to, amount } = data;

  try {
    await pool.query(
      "CALL cuenta_retirar($1,$2,$3,$4,$5)",
      [to, 3, 1, amount, "Rollback transferencia interbancaria"]
    );
    console.log("Rollback aplicado a TX:", id);
  } catch (err) {
    console.error("Error en handleTransferRollback:", err);
  }
}

// ================== ENDPOINT TRANSFERENCIAS INTERBANCARIAS ==================

app.post("/api/v1/transfers/interbank", verifyToken, async (req, res) => {
  console.log(">>> Entró a /api/v1/transfers/interbank");
  try {
    const { from, to, amount, currency, description } = req.body;

    if (!from || !to || !amount || !currency) {
      return res.status(400).json({
        mensaje: "Faltan datos: from, to, amount, currency son obligatorios",
      });
    }

    const monto = Number(amount);
    if (isNaN(monto) || monto <= 0) {
      return res.status(400).json({
        mensaje: "El monto debe ser un número positivo",
      });
    }

    const fromNorm = from.replace(/[\s-]/g, "").toUpperCase();
    const toNorm   = to.replace(/[\s-]/g, "").toUpperCase();

    if (!isValidCostaRicaIban(fromNorm) || !isValidCostaRicaIban(toNorm)) {
      return res.status(400).json({
        mensaje: "Alguno de los IBAN no tiene el formato válido",
      });
    }

    const cuentas = await pool.query("SELECT * FROM select_cuenta($1)", [
      req.user.userId,
    ]);

    const cuentaOrigen = cuentas.rows.find((c) => c.account_id === fromNorm);
    if (!cuentaOrigen) {
      return res.status(403).json({
        mensaje: "La cuenta origen no pertenece al usuario autenticado",
      });
    }

    if (!centralSocket.connected) {
      console.error("No hay conexión activa con el Banco Central");
      return res.status(503).json({
        mensaje: "Banco Central no disponible en este momento. Intente más tarde.",
      });
    }

    const txId = `TX-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    console.log("🌐 Iniciando transferencia interbancaria TX:", txId);

    const waitResult = waitForTransferResult(txId);
     console.log("Enviando intención de transferencia al Banco Central:", {
      id: txId,
      from: fromNorm,
      to: toNorm,
      amount: monto,
      currency: currency.toUpperCase()
    });
    sendTransferIntent({
      id: txId,
      from: fromNorm,
      to: toNorm,
      amount: monto,
      currency: currency.toUpperCase()
    
    });


    const result = await waitResult;
    console.log("✅ Resultado TX", txId, "=>", result);

    if (!result.ok) {
      const reason = result.reason || "UNKNOWN";

      const friendlyMessages = {
        INVALID_PAYLOAD: "Ocurrió un error con los datos de la transferencia.",
        SAME_BANK_NOT_ALLOWED:
          "Debe usar transferencia interna para este movimiento.",
        UNKNOWN_BANK: "El banco de destino no es reconocido.",
        DEST_BANK_OFFLINE: "El banco de destino no está disponible.",
        ACCOUNT_NOT_FOUND: "La cuenta destino no existe.",
        ACCOUNT_NO_CREDIT:
          "La cuenta destino no permite recibir este tipo de operaciones.",
        CURRENCY_NOT_SUPPORTED:
          "La moneda no coincide con la cuenta destino.",
        NO_FUNDS: "Fondos insuficientes para completar la transferencia.",
        RESERVE_FAILED:
          "No se pudo reservar el monto en la cuenta origen.",
        CREDIT_FAILED:
          "No fue posible acreditar los fondos en el banco destino.",
        DEBIT_FAILED:
          "No fue posible debitar los fondos de la cuenta origen.",
        TIMEOUT:
          "El Banco Central no respondió a tiempo. Intente de nuevo.",
      };

      return res.status(409).json({
        mensaje:
          friendlyMessages[reason] ||
          "La transferencia fue rechazada por el Banco Central.",
        reason,
      });
    }

    return res.status(200).json({
      mensaje: "Transferencia interbancaria realizada con éxito",
      id: txId,
    });
  } catch (err) {
    console.error("❌ Error en /api/v1/transfers/interbank:", err);
    console.log(err.stack);
    return res.status(500).json({
      mensaje: "Error interno procesando transferencia interbancaria",
    });
  }
});

//-----------------------------------------------------------------------------------------