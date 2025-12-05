
-- Roles
INSERT INTO rol (nombre, descripcion) VALUES
('Admin', 'Usuario con acceso total al sistema'),
('Cliente', 'Usuario con acceso a sus productos financieros');


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


-- Usuario Administrador
CALL insert_usuario(
    115470800, 
    1, 'Admin', 'Master', 'Root', 'admin',
    '1985-01-01', 'admin@example.com', '+50670000000',
    'Admin2025', 1
);

-- Usuario Cliente
CALL insert_usuario(
    115470822,  
    1, 'Carlo', 'Mora', 'Solis', 'cmorad',
    '1998-04-15', 'carlos.mra@example.com', '+50660001234',
    'Carlos2025', 2
);


-- Cuenta en colones (Ahorro)
CALL insert_cuenta(
  NULL,         -- p_account_id → que el SP genere el IBAN CR01B07XXXXXXXXXXXX
  115470822,    -- p_usuario_documento
  3,            -- p_tipo
  1,            -- p_moneda
  1050000.50,   -- p_saldo
  1             -- p_estado
);

select * from cuenta;

-- Cuenta en dólares (Corriente)
INSERT INTO cuenta (account_id, usuario_documento, tipo, moneda, saldo, estado)
VALUES (
    'CR01-4321-8765-000000000012',
    115470822,
    2,  
    2, 
    3200.00,
    1
);
-- Cuenta en colones (Ahorro)
INSERT INTO cuenta (account_id, usuario_documento, tipo, moneda, saldo, estado)
VALUES (
    'CR01-1234-5678-000000000013',
    115470822,
    1,  
    1,  
    1050000.50,
    1   
);


-- Tarjeta Gold CRC
INSERT INTO tarjeta (
    card_id, usuario_documento, cuenta_id, tipo, numero_tarjeta, exp, moneda,
    limite, saldo, pin_hash, cvv_hash
)
VALUES (
    'CARD-011',
    115470822,
    'CR01-1234-5678-000000000011',
    1,  
    '4111 0000 0000 1111',
    '11/26',
    1, 
    5000000.00,
    1250000.00,
    'hashpin111',
    'hashcvv111'
);

-- Tarjeta Platinum USD
INSERT INTO tarjeta (
    card_id, usuario_documento, cuenta_id, tipo, numero_tarjeta, exp, moneda,
    limite, saldo, pin_hash, cvv_hash
)
VALUES (
    'CARD-012',
    115470822,
    'CR01-4321-8765-000000000012',
    2, 
    '5222 0000 0000 2222',
    '08/27',
    2,  
    10000.00,
    2500.00,
    'hashpin222',
    'hashcvv222'
);


-- Movimientos de cuenta CRC (Ahorro)
INSERT INTO movimiento_cuenta (account_id, tipo, descripcion, moneda, monto) VALUES
('CR01-1234-5678-000000000011', 1, 'Depósito nómina', 1, 500000.00),
('CR01-1234-5678-000000000011', 2, 'Pago servicios agua', 1, 5000.00),
('CR01-1234-5678-000000000011', 2, 'Compra supermercado', 1, 10000.00);

-- Movimientos de cuenta USD (Corriente)
INSERT INTO movimiento_cuenta (account_id, tipo, descripcion, moneda, monto) VALUES
('CR01-4321-8765-000000000012', 1, 'Transferencia internacional', 2, 1200.00),
('CR01-4321-8765-000000000012', 2, 'Pago suscripción mensual', 2, 50.00),
('CR01-4321-8765-000000000012', 2, 'Compra en línea', 2, 100.00);


INSERT INTO movimiento_tarjeta (card_id, tipo, descripcion, moneda, monto) VALUES
('CARD-011', 1, 'Pago Supermercado', 1, 35000.75),
('CARD-012', 1, 'Compra en Amazon', 2, 120.50);
