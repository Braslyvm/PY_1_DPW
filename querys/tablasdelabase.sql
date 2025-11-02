
-- ======= TABLAS =======
CREATE TABLE rol (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50),
    descripcion TEXT
);

-- ======= INSERTS PARA TABLA ROL =======

INSERT INTO rol (nombre, descripcion)
VALUES 
('Admin', 'Usuario con acceso completo al sistema, puede gestionar cuentas, usuarios y movimientos.'),
('Cliente', 'Usuario estándar con acceso a sus cuentas, tarjetas y movimientos personales.');
select * from rol

CREATE TABLE tipo_identificacion (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50),
    descripcion TEXT
);

CREATE TABLE moneda (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50),
    iso VARCHAR(10)
);

CREATE TABLE tipo_cuenta (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50)
);

CREATE TABLE estado_cuenta (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50)
);

CREATE TABLE tipo_movimiento_cuenta (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50),
    descripcion TEXT
);


CREATE TABLE tipo_tarjeta (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50)
);

CREATE TABLE tipo_movimiento_tarjeta (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50),
    descripcion TEXT
);

-- ======= USUARIO =======
CREATE TABLE usuario (
    numero_documento SERIAL PRIMARY KEY,
    tipo_identificacion INT NOT NULL,
    nombre VARCHAR(50) NOT NULL,
    apellido1 VARCHAR(50) NOT NULL,
    apellido2 VARCHAR(50) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    fecha_nacimiento DATE,
    correo VARCHAR(100) UNIQUE NOT NULL CHECK (correo LIKE '%@%'),
    telefono VARCHAR(25),
    contrasena VARCHAR(255) NOT NULL,
    rol INT NOT NULL,
    FOREIGN KEY (tipo_identificacion) REFERENCES tipo_identificacion(id),
    FOREIGN KEY (rol) REFERENCES rol(id)
);

-- ======= CUENTAS =======
CREATE TABLE cuenta (
    account_id VARCHAR(30) PRIMARY KEY,
    usuario_documento INT NOT NULL,
    tipo INT NOT NULL,
    moneda INT NOT NULL,
    saldo NUMERIC(18,2) DEFAULT 0 CHECK (saldo >= 0),
    estado INT DEFAULT 1,
    FOREIGN KEY (usuario_documento) REFERENCES usuario(numero_documento),
    FOREIGN KEY (tipo) REFERENCES tipo_cuenta(id),
    FOREIGN KEY (moneda) REFERENCES moneda(id),
    FOREIGN KEY (estado) REFERENCES estado_cuenta(id)
);

-- ======= MOVIMIENTOS DE CUENTAS =======
CREATE TABLE movimiento_cuenta (
    id SERIAL PRIMARY KEY,
    account_id VARCHAR(30) NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tipo INT NOT NULL,
    descripcion TEXT,
    moneda INT NOT NULL,
    monto NUMERIC(18,2) NOT NULL CHECK (monto > 0),
    FOREIGN KEY (account_id) REFERENCES cuenta(account_id),
    FOREIGN KEY (tipo) REFERENCES tipo_movimiento_cuenta(id),
    FOREIGN KEY (moneda) REFERENCES moneda(id)
);

-- ======= TARJETAS =======
CREATE TABLE tarjeta (
    card_id VARCHAR(20) PRIMARY KEY,
    usuario_documento INT NOT NULL,
    cuenta_id VARCHAR(30) NOT NULL, 
    tipo INT NOT NULL,
    numero_tarjeta VARCHAR(25) UNIQUE NOT NULL,
    exp VARCHAR(7) NOT NULL CHECK (exp ~ '^[0-9]{2}/[0-9]{2}$'),
    moneda INT NOT NULL,
    limite NUMERIC(18,2) DEFAULT 0 CHECK (limite >= 0),
    saldo NUMERIC(18,2) DEFAULT 0 CHECK (saldo >= 0),
    pin_hash VARCHAR(255),
    cvv_hash VARCHAR(255),
    FOREIGN KEY (usuario_documento) REFERENCES usuario(numero_documento),
    FOREIGN KEY (cuenta_id) REFERENCES cuenta(account_id),
    FOREIGN KEY (tipo) REFERENCES tipo_tarjeta(id),
    FOREIGN KEY (moneda) REFERENCES moneda(id)
);

-- ======= MOVIMIENTOS DE TARJETAS =======
CREATE TABLE movimiento_tarjeta (
    id SERIAL PRIMARY KEY,
    card_id VARCHAR(20) NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tipo INT NOT NULL,
    descripcion TEXT,
    moneda INT NOT NULL,
    monto NUMERIC(18,2) NOT NULL CHECK (monto > 0),
    FOREIGN KEY (card_id) REFERENCES tarjeta(card_id),
    FOREIGN KEY (tipo) REFERENCES tipo_movimiento_tarjeta(id),
    FOREIGN KEY (moneda) REFERENCES moneda(id)
);

-- ======= API KEY =======
CREATE TABLE api_key (
    id SERIAL PRIMARY KEY,
    clave_hash VARCHAR(255) NOT NULL,
    etiqueta VARCHAR(100),
    activa BOOLEAN DEFAULT TRUE CHECK (activa IN (TRUE, FALSE))
);
CREATE TABLE otp (
    id SERIAL PRIMARY KEY,
    usuario INT NOT NULL REFERENCES usuario(numero_documento),
    codigo VARCHAR(6) NOT NULL,                    
    proposito VARCHAR(50) NOT NULL,                 
    creado_en TIMESTAMP DEFAULT NOW(),            
    expira_en TIMESTAMP DEFAULT NOW() + INTERVAL '2 minutes', 
    consumido BOOLEAN DEFAULT FALSE                 
);








