# Banco NSFMS – Documentación de WebSockets (Banco Central)

> **Alcance de este documento:**  
> Este archivo documenta **únicamente** la integración por **WebSockets** entre el Banco NSFMS y el “Banco Central” (servidor externo).  
> La documentación de endpoints REST (login, cuentas, tarjetas, etc.) se maneja aparte.

---

## 1. Arquitectura general

- El backend del banco corre como servidor HTTP (Express) y **cliente WebSocket**.
- Se conecta a un Banco Central simulado en:

```ts
const CENTRAL_WS_URL = "http://137.184.36.3:6000";
```

- La conexión se realiza con `socket.io-client` y un bloque de autenticación:

```ts
const centralSocket = io(CENTRAL_WS_URL, {
  transports: ["websocket"],
  auth: {
    bankId:  "B07",
    bankName: "Banco NSFM",
    token: "BANK-CENTRAL-IC8057-2025",
  },
});
```

- Una vez autenticado:
  - El Banco NSFMS **envía** mensajes para iniciar transferencias interbancarias.
  - El Banco Central **envía eventos** para reservar, acreditar, debitar o revertir fondos.

---

## 2. Tablas y procedimientos relevantes (modelo de datos)

La integración WS se apoya en el siguiente modelo (ver diagrama ER):

### Tablas principales

- **`usuario`**
  - `numero_documento` (PK), `tipo_identificacion`, `nombre`, `apellidos`, `correo`, `telefono`, `contrasena`, `rol`…

- **`cuenta`**
  - `account_id` (PK, IBAN)
  - `usuario_documento` (FK → usuario)
  - `tipo` (FK → tipo_cuenta)
  - `moneda` (FK → moneda)
  - `saldo` (numeric)
  - `estado` (FK → estado_cuenta)
  - `permite_debito` (bool)
  - `permite_credito` (bool)

- **`movimiento_cuenta`**
  - `id` (PK)
  - `account_id` (FK → cuenta)
  - `fecha` (timestamp)
  - `tipo` (FK → tipo_movimiento_cuenta)
  - `descripcion`
  - `moneda`
  - `monto`

- **`tarjeta` / `movimiento_tarjeta`**
  - Se usan para tarjetas de crédito/débito, pero **no participan directamente** en la mensajería del Banco Central.

### Catálogos

- `tipo_cuenta` – Ahorro, Corriente, Crédito…  
- `tipo_movimiento_cuenta` – Crédito, Débito…  
- `moneda` – `CRC`, `USD`.  
- `estado_cuenta` – Activa, Inactiva, Bloqueada, etc.  
- `rol`, `tipo_identificacion`, `tipo_tarjeta`, `tipo_movimiento_tarjeta`.

### Procedimientos almacenados relevantes

- `cuenta_depositar(account_id, tipo_mov, moneda, monto, descripcion)`  
- `cuenta_retirar(account_id, tipo_mov, moneda, monto, descripcion)`  
- (Opcionales) SP de validación: `sp_bank_validate_account(iban)`

Estos SP son invocados por los handlers de WebSocket para acreditar/debitar fondos.

---

## 3. Conexión y eventos base

### 3.1. Ciclo de vida de la conexión

- `centralSocket.on("connect")`  
  → Loguea `Conectado al Banco Central. socket.id = ...`

- `centralSocket.on("disconnect", reason)`  
  → Loguea causa de desconexión.

- `centralSocket.on("connect_error", err)`  
  → Loguea el error de conexión al Banco Central.

El cliente **debe estar conectado** para poder enviar transferencias. De lo contrario,
el endpoint `/api/v1/transfers/interbank` responde `503 Banco Central no disponible`.

### 3.2. Registro interno de transferencias pendientes

```ts
const pendingTransfers = new Map<string, { resolve: (data:any)=>void }>();
```

- Cada transferencia interbancaria se identifica con un `id` (`TX-...`).
- Cuando se envía una intención de transferencia, se registra un `Promise` en `pendingTransfers`.
- Al llegar eventos `transfer.commit` o `transfer.reject`, se resuelve la promesa correspondiente.

Helpers:

```ts
function sendTransferIntent(payload) { ... }      // emite 'transfer.intent'
function waitForTransferResult(id) { ... }        // Promise que espera commit/reject
function resolveTransferPromise(id, payload) { ... }
```

---

## 4. Mensajes WebSocket – Especificación

Todos los mensajes se envían/reciben con el siguiente **envoltorio**:

```jsonc
{
  "type": "nombre.del.evento",
  "data": { ...payloadEspecífico }
}
```

### 4.1. Mensajes salientes desde el Banco NSFMS

#### 4.1.1. `transfer.intent`

Enviado al Banco Central cuando el cliente llama al endpoint
`POST /api/v1/transfers/interbank` y la validación local es correcta.

**Estructura:**

```json
{
  "type": "transfer.intent",
  "data": {
    "id": "TX-1733358123456-1234",
    "from": "CR01B07000000000001",
    "to": "CR01B03000000000005",
    "amount": 10000.50,
    "currency": "CRC"
  }
}
```

- `id`: identificador único de la transferencia (string).
- `from`: IBAN origen (formato CR01B0X...).
- `to`: IBAN destino.
- `amount`: monto numérico positivo.
- `currency`: `CRC` o `USD` (debe coincidir con la moneda de la cuenta).

El Banco NSFMS espera luego los eventos de resultado a través de la conexión WS.

---

### 4.2. Mensajes entrantes desde el Banco Central

#### 4.2.1. `transfer.reserve`

El Banco Central solicita al banco origen que **verifique** si se puede reservar el monto.

**Payload esperado:**

```json
{
  "id": "TX-1733358123456-1234",
  "from": "CR01B07000000000001",
  "amount": 10000.50,
  "currency": "CRC"
}
```

**Lógica en `handleTransferReserve(data)`**:

1. Buscar la cuenta origen:

   ```sql
   SELECT saldo, moneda, permite_debito
   FROM cuenta
   WHERE account_id = $1;
   ```

2. Validar:
   - Que la cuenta exista.
   - Que `permite_debito = TRUE`.
   - Que `saldo >= amount`.

3. Responder al Banco Central:

   - Éxito:

     ```json
     {
       "type": "transfer.reserve.result",
       "data": { "id": "TX-...", "ok": true }
     }
     ```

   - Error (ejemplos):

     ```json
     {
       "type": "transfer.reserve.result",
       "data": { "id": "TX-...", "ok": false, "reason": "ACCOUNT_NOT_FOUND" }
     }
     ```

     Razones posibles: `ACCOUNT_NOT_FOUND`, `ACCOUNT_NO_DEBIT`, `NO_FUNDS`, `RESERVE_FAILED`.

---

#### 4.2.2. `transfer.credit`

El Banco Central ordena **acreditar** fondos en la cuenta destino.

**Payload esperado:**

```json
{
  "id": "TX-1733358123456-1234",
  "to": "CR01B07000000000002",
  "amount": 10000.50,
  "currency": "CRC"
}
```

**Lógica en `handleTransferCredit(data)`**:

1. Validar cuenta destino:

   ```sql
   SELECT moneda, permite_credito
   FROM cuenta
   WHERE account_id = $1;
   ```

2. Verificar:
   - Cuenta existe.
   - `permite_credito = TRUE`.
   - `moneda` coincide con `currency`.

3. Ejecutar depósito:

   ```sql
   CALL cuenta_depositar(
     cuenta_id := to,
     tipo_mov  := 1, -- ej. Crédito
     moneda    := cuenta.moneda,
     monto     := amount,
     descripcion := 'Transferencia interbancaria recibida'
   );
   ```

4. Responder al Banco Central:

   - `ok: true` si todo sale bien.
   - `ok: false` y `reason` (`ACCOUNT_NOT_FOUND`, `ACCOUNT_NO_CREDIT`,
     `CURRENCY_NOT_SUPPORTED`, `CREDIT_FAILED`) si algo falla.

---

#### 4.2.3. `transfer.debit`

El Banco Central indica que ya se puede **debitar** definitivamente la cuenta origen
(tras una reserva exitosa).

**Payload esperado:**

```json
{
  "id": "TX-1733358123456-1234",
  "from": "CR01B07000000000001",
  "amount": 10000.50
}
```

**Lógica en `handleTransferDebit(data)`**:

- Ejecutar retiro:

  ```sql
  CALL cuenta_retirar(
    cuenta_id := from,
    tipo_mov  := 2, -- ej. Débito
    moneda    := 1, -- (catálogo de moneda, se puede mejorar a partir de la cuenta)
    monto     := amount,
    descripcion := 'Transferencia interbancaria enviada'
  );
  ```

- Responder con `transfer.debit.result` (ok / error con reason `DEBIT_FAILED`).

---

#### 4.2.4. `transfer.rollback`

Si la transferencia falla luego de acreditar fondos, el Banco Central puede pedir un **rollback**.

**Payload esperado:**

```json
{
  "id": "TX-1733358123456-1234",
  "to": "CR01B07000000000002",
  "amount": 10000.50
}
```

**Lógica en `handleTransferRollback(data)`**:

- Ejecutar operación compensatoria en la cuenta destino (ej. registrar retiro o reverso):

  ```sql
  CALL cuenta_retirar(
    cuenta_id := to,
    tipo_mov  := 3, -- tipo especial para rollback
    moneda    := 1,
    monto     := amount,
    descripcion := 'Rollback transferencia interbancaria'
  );
  ```

- No se envía un resultado explícito al Banco Central en el código actual, solo logs.

---

#### 4.2.5. `transfer.commit` / `transfer.reject`

Estos eventos **no modifican saldo** en el banco; solamente sirven para notificar que
la transferencia global fue **aprobada** o **rechazada**.

En ambos casos, se llama a `resolveTransferPromise(id, payload)` para resolver la
promesa creada al enviar `transfer.intent`:

- `transfer.commit` → `{ ok: true }`
- `transfer.reject` → `{ ok: false, reason: "NO_FUNDS" | ... }`

El endpoint HTTP `/api/v1/transfers/interbank` interpreta ese resultado y responde al cliente.

---

### 4.3. Otros mensajes

- `transfer.init` – mensaje informativo enviado por el Banco Central cuando se arranca
  el flujo; actualmente solo se loguea.

---

## 5. Endpoint HTTP asociado: `/api/v1/transfers/interbank`

Este endpoint es la **puerta de entrada** HTTP para el frontend. Aquí se validan los
datos y se dispara la lógica de WebSockets.

```http
POST /api/v1/transfers/interbank
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "from": "CR01B07000000000001",
  "to":   "CR01B03000000000005",
  "amount": 10000.50,
  "currency": "CRC",
  "description": "Pago de servicios"
}
```

### 5.1. Validaciones principales

1. Campos obligatorios: `from`, `to`, `amount`, `currency`.
2. `amount` > 0 y numérico.
3. Formato IBAN de Costa Rica para `from` y `to` (`CR01B0[1-8]...`).
4. La cuenta `from` debe pertenecer al usuario autenticado (`select_cuenta(userId)`).
5. **Debe haber conexión** activa con el Banco Central (`centralSocket.connected`).

Si alguna validación falla → respuesta 400 / 403 / 503 según el caso.

### 5.2. Flujo con el Banco Central

1. Se genera `txId` (`TX-<timestamp>-<random>`).
2. Se llama a `waitForTransferResult(txId)` (crea promesa en `pendingTransfers`).
3. Se envía `transfer.intent` con `sendTransferIntent(...)`.
4. Se espera el resultado (commit / reject):
   - `ok: true` → HTTP 200 “Transferencia interbancaria realizada con éxito”.
   - `ok: false` → HTTP 409 con mensaje amigable según `reason`.

Los códigos `reason` que se traducen a mensajes son, por ejemplo:

- `INVALID_PAYLOAD`
- `SAME_BANK_NOT_ALLOWED`
- `UNKNOWN_BANK`
- `DEST_BANK_OFFLINE`
- `ACCOUNT_NOT_FOUND`
- `ACCOUNT_NO_CREDIT`
- `CURRENCY_NOT_SUPPORTED`
- `NO_FUNDS`
- `RESERVE_FAILED`
- `CREDIT_FAILED`
- `DEBIT_FAILED`
- `TIMEOUT`

---

## 6. Cómo probar la integración

### 6.1. Iniciar el backend

1. Configurar variables de entorno (`.env`):

```env
PGHOST=...
PGPORT=5432
PGUSER=...
PGPASSWORD=...
PGDATABASE=...
JWT_SECRET=tu_clave_jwt
API_KEY=clave-api-proyecto2
BANK_CENTRAL_TOKEN=BANK-CENTRAL-IC8057-2025
```

2. Instalar dependencias:

```bash
npm install
```

3. Ejecutar el servidor:

```bash
node server.js
# o
npm start
```

Al iniciarse deberías ver en la consola:

- `Conectado a PostgreSQL`
- `Servidor corriendo en http://localhost:4000`
- `Conectado al Banco Central. socket.id = ...` (cuando el WS se conecte).

### 6.2. Probar una transferencia interbancaria (ejemplo con curl)

```bash
curl -X POST http://localhost:4000/api/v1/transfers/interbank   -H "Content-Type: application/json"   -H "Authorization: Bearer <JWT_VALIDO>"   -d '{
    "from": "CR01B07000000000001",
    "to":   "CR01B03000000000005",
    "amount": 15000.75,
    "currency": "CRC",
    "description": "Prueba Banco Central"
  }'
```

Si todo está bien:
- En la consola del backend verás trazas de `transfer.reserve`, `transfer.credit`, `transfer.debit`, etc.
- En la base de datos se registrarán movimientos en las tablas de `movimiento_cuenta`.
- El cliente HTTP recibirá una respuesta 200 con el `id` de la transferencia.

---

## 7. Resumen rápido para el informe / rúbrica

- **Instalación y setup**
  - Variables `.env` documentadas.
  - Comandos `npm install` + `npm start`.
  - Log esperado al conectarse a PostgreSQL y al Banco Central.

- **Descripción clara de WebSockets**
  - URL del Banco Central (`CENTRAL_WS_URL`).
  - Datos de autenticación (`bankId`, `bankName`, `token`).

- **Eventos WebSocket documentados**
  - Saliente: `transfer.intent`.
  - Entrantes: `transfer.reserve`, `transfer.credit`, `transfer.debit`, `transfer.rollback`, `transfer.commit`, `transfer.reject`, `transfer.init`.
  - Para cada uno: payload esperado, validaciones, SP que se invocan, respuesta que se envía.

- **Flujo de negocio descrito**
  - Paso a paso de una transferencia interbancaria.
  - Manejo de errores y `reason codes`.

- **Relación con tablas**
  - Cómo los eventos impactan `cuenta` y `movimiento_cuenta`.
  - Uso de catálogos de `moneda`, `tipo_movimiento_cuenta`, etc.

Con este documento deberías cumplir el criterio de **“Documentación completa: endpoints WebSocket, flujos, ejemplos y descripción clara de estados y tablas”**, centrado exclusivamente en la capa de WebSockets.
