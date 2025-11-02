-- Roles
INSERT INTO rol (nombre, descripcion) VALUES
('Admin', 'Usuario con acceso total al sistema'),
('Cliente', 'Usuario con acceso a sus productos financieros');

-- Tipos de identificación
INSERT INTO tipo_identificacion (nombre, descripcion) VALUES
('Nacional', 'Documento de identidad costarricense'),
('DIMEX', 'Documento de extranjeros'),
('Pasaporte', 'Documento internacional');

-- Monedas
INSERT INTO moneda (nombre, iso) VALUES
('Colón', 'CRC'),
('Dólar', 'USD');

-- Tipos de cuenta
INSERT INTO tipo_cuenta (nombre) VALUES
('Ahorro'),
('Corriente'),
('Crédito');

-- Estados de cuenta
INSERT INTO estado_cuenta (nombre) VALUES
('Activa'),
('Inactiva'),
('Bloqueada');

-- Tipos de movimiento de cuenta
INSERT INTO tipo_movimiento_cuenta (nombre, descripcion) VALUES
('Crédito', 'Aumenta el saldo de la cuenta'),
('Débito', 'Disminuye el saldo de la cuenta');

-- Tipos de tarjeta
INSERT INTO tipo_tarjeta (nombre) VALUES
('Gold'),
('Platinum'),
('Black');

-- Tipos de movimiento de tarjeta
INSERT INTO tipo_movimiento_tarjeta (nombre, descripcion) VALUES
('Compra', 'Compra realizada con tarjeta'),
('Pago', 'Pago de saldo de tarjeta');

INSERT INTO usuario (
    tipo_identificacion, nombre, apellido1, apellido2,
    username, fecha_nacimiento, correo, telefono, contrasena, rol
)
VALUES (
    1, -- Nacional
    'Elder', 'León', 'Solis',
    'ElderLeon', '2003-06-12', 'elderleon@gmail.com', '+506 8888-7777',
    'Eld7030612', 2 -- Cliente
);
-- Cuenta 1: Ahorro CRC
INSERT INTO cuenta (account_id, usuario_documento, tipo, moneda, saldo, estado)
VALUES (
    'CR01-1234-5678-000000000011',
    1, -- número_documento autoincremental del usuario Elder León
    1, -- Ahorro
    1, -- CRC
    1050000.50,
    1 -- Activa
);

-- Cuenta 2: Corriente USD
INSERT INTO cuenta (account_id, usuario_documento, tipo, moneda, saldo, estado)
VALUES (
    'CR01-4321-8765-000000000012',
    1,
    2, -- Corriente
    2, -- USD
    3200.00,
    1
);
-- Tarjeta Gold CRC
INSERT INTO tarjeta (
    card_id, usuario_documento, cuenta_id, tipo, numero_tarjeta, exp, moneda, limite, saldo, pin_hash, cvv_hash
)
VALUES (
    'CARD-011',
    1,
    'CR01-1234-5678-000000000011',
    1, -- Gold
    '4111 0000 0000 1111',
    '11/26',
    1, -- CRC
    5000000.00,
    1250000.00,
    'hashpin111', 'hashcvv111'
);

-- Tarjeta Platinum USD
INSERT INTO tarjeta (
    card_id, usuario_documento, cuenta_id, tipo, numero_tarjeta, exp, moneda, limite, saldo, pin_hash, cvv_hash
)
VALUES (
    'CARD-012',
    1,
    'CR01-4321-8765-000000000012',
    2, -- Platinum
    '5222 0000 0000 2222',
    '08/27',
    2, -- USD
    10000.00,
    2500.00,
    'hashpin222', 'hashcvv222'
);
-- Movimientos de cuenta CRC (Ahorro)
INSERT INTO movimiento_cuenta (account_id, tipo, descripcion, moneda, monto)
VALUES
('CR01-1234-5678-000000000011', 1, 'Depósito nómina', 1, 500000.00),
('CR01-1234-5678-000000000011', 2, 'Pago servicios agua', 1, 5000.00),
('CR01-1234-5678-000000000011', 2, 'Compra supermercado', 1, 10000.00);

-- Movimientos de cuenta USD (Corriente)
INSERT INTO movimiento_cuenta (account_id, tipo, descripcion, moneda, monto)
VALUES
('CR01-4321-8765-000000000012', 1, 'Transferencia internacional', 2, 1200.00),
('CR01-4321-8765-000000000012', 2, 'Pago suscripción mensual', 2, 50.00),
('CR01-4321-8765-000000000012', 2, 'Compra en línea', 2, 100.00);
-- Tarjeta Gold CRC
INSERT INTO movimiento_tarjeta (card_id, tipo, descripcion, moneda, monto)
VALUES
('CARD-011', 1, 'Pago Supermercado', 1, 35000.75);

-- Tarjeta Platinum USD
INSERT INTO movimiento_tarjeta (card_id, tipo, descripcion, moneda, monto)
VALUES
('CARD-012', 1, 'Compra en Amazon', 2, 120.50);
SELECT * FROM usuario;
SELECT * FROM cuenta;
SELECT * FROM tarjeta;
SELECT * FROM movimiento_cuenta;
SELECT * FROM movimiento_tarjeta;


CALL insert_usuario(
    1, -- tipo_identificacion: Nacional
    'Carlos', -- nombre
    'Mora',   -- primer apellido
    'Solis',  -- segundo apellido
    'cmora',  -- username
    '1998-04-15', -- fecha de nacimiento
    'carlos.mora@example.com', -- correo
    '+506 6000-1234', -- teléfono
    'Carlos2025', -- contraseña en texto plano (se encripta dentro del SP)
    2 -- rol: Cliente
);
