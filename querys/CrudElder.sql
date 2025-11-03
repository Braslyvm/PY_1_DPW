


-- tipo_movimiento_cuenta

create procedure insert_tipo_movimiento_cuenta(
    p_nombre varchar(50),
    p_descripcion text
)
language plpgsql
as $$
begin
    insert into tipo_movimiento_cuenta (nombre, descripcion)
    values (p_nombre, p_descripcion);
end;
$$;

create procedure delete_tipo_movimiento_cuenta(p_id integer)
language plpgsql
as $$
begin
    delete from tipo_movimiento_cuenta where id = p_id;
end;
$$;

create procedure update_tipo_movimiento_cuenta(
    p_id integer,
    p_nombre varchar(50) default null,
    p_descripcion text default null
)
language plpgsql
as $$
begin
    update tipo_movimiento_cuenta
    set nombre = coalesce(nullif(p_nombre, ''), nombre),
        descripcion = coalesce(nullif(p_descripcion, ''), descripcion)
    where id = p_id;
end;
$$;

create or replace function select_tipo_movimiento_cuenta()
returns table (id int, nombre varchar(50), descripcion text)
language plpgsql
as $$
begin
    return query
    select tmc.id, tmc.nombre, tmc.descripcion
    from tipo_movimiento_cuenta tmc
    order by tmc.id;
end;
$$;


-- tipo_tarjeta

create procedure insert_tipo_tarjeta(p_nombre varchar(50))
language plpgsql
as $$
begin
    insert into tipo_tarjeta (nombre) values (p_nombre);
end;
$$;

create procedure delete_tipo_tarjeta(p_id integer)
language plpgsql
as $$
begin
    delete from tipo_tarjeta where id = p_id;
end;
$$;

create procedure update_tipo_tarjeta(
    p_id integer,
    p_nombre varchar(50) default null
)
language plpgsql
as $$
begin
    update tipo_tarjeta
    set nombre = coalesce(nullif(p_nombre, ''), nombre)
    where id = p_id;
end;
$$;




-- tipo_movimiento_tarjeta

create procedure insert_tipo_movimiento_tarjeta(
    p_nombre varchar(50),
    p_descripcion text
)
language plpgsql
as $$
begin
    insert into tipo_movimiento_tarjeta (nombre, descripcion)
    values (p_nombre, p_descripcion);
end;
$$;

create procedure delete_tipo_movimiento_tarjeta(p_id integer)
language plpgsql
as $$
begin
    delete from tipo_movimiento_tarjeta where id = p_id;
end;
$$;

create procedure update_tipo_movimiento_tarjeta(
    p_id integer,
    p_nombre varchar(50) default null,
    p_descripcion text default null
)
language plpgsql
as $$
begin
    update tipo_movimiento_tarjeta
    set nombre = coalesce(nullif(p_nombre, ''), nombre),
        descripcion = coalesce(nullif(p_descripcion, ''), descripcion)
    where id = p_id;
end;
$$;

create or replace function select_tipo_movimiento_tarjeta()
returns table (id int, nombre varchar(50), descripcion text)
language plpgsql
as $$
begin
    return query
    select tmt.id, tmt.nombre, tmt.descripcion
    from tipo_movimiento_tarjeta tmt
    order by tmt.id;
end;
$$;



-- Insertar cuenta
create or replace procedure insert_cuenta(
    p_account_id varchar(30),
    p_usuario_documento int,
    p_tipo int,
    p_moneda int,
    p_saldo numeric(18,2) default 0,
    p_estado int default 1
)
language plpgsql
as $$
begin
    if coalesce(p_saldo,0) < 0 then
        raise exception 'El saldo inicial no puede ser negativo';
    end if;

    insert into cuenta (account_id, usuario_documento, tipo, moneda, saldo, estado)
    values (p_account_id, p_usuario_documento, p_tipo, p_moneda, coalesce(p_saldo,0), p_estado);
end;
$$;

-- Actualizar cuenta
create or replace procedure update_cuenta(
    p_account_id varchar(30),
    p_tipo int default null,
    p_moneda int default null,
    p_estado int default null
)
language plpgsql
as $$
begin
    update cuenta
    set tipo = coalesce(p_tipo, tipo),
        moneda = coalesce(p_moneda, moneda),
        estado = coalesce(p_estado, estado)
    where account_id = p_account_id;
end;
$$;


-- Eliminar cuenta
create or replace procedure delete_cuenta(p_account_id varchar(30))
language plpgsql
as $$
declare v_saldo numeric(18,2);
begin
    select saldo into v_saldo from cuenta where account_id = p_account_id for update;
    if not found then
        raise exception 'Cuenta % no existe', p_account_id;
    end if;
    if v_saldo <> 0 then
        raise exception 'No se puede eliminar una cuenta con saldo distinto de 0';
    end if;
    delete from cuenta where account_id = p_account_id;
end;
$$;

-- Consultar cuentas
create or replace function select_cuenta(
    p_usuario_documento int default null,
    p_estado int default null
)
returns table (
    account_id varchar(30),
    usuario_documento int,
    tipo int,
    moneda int,
    saldo numeric(18,2),
    estado int
)
language plpgsql
as $$
begin
    return query
    select c.account_id, c.usuario_documento, c.tipo, c.moneda, c.saldo, c.estado
    from cuenta c
    where (p_usuario_documento is null or c.usuario_documento = p_usuario_documento)
      and (p_estado is null or c.estado = p_estado)
    order by c.account_id;
end;
$$;



-- Depósito
create or replace procedure cuenta_depositar(
    p_account_id varchar(30),
    p_tipo_mov int,
    p_moneda int,
    p_monto numeric(18,2),
    p_descripcion text default null
)
language plpgsql
as $$
declare v_saldo numeric(18,2);
begin
    if p_monto <= 0 then raise exception 'El monto debe ser positivo'; end if;
    select saldo into v_saldo from cuenta where account_id = p_account_id for update;
    if not found then raise exception 'Cuenta % no existe', p_account_id; end if;

    update cuenta set saldo = saldo + p_monto where account_id = p_account_id;
    insert into movimiento_cuenta (account_id, tipo, descripcion, moneda, monto)
    values (p_account_id, p_tipo_mov, coalesce(p_descripcion,'Depósito'), p_moneda, p_monto);
end;
$$;

-- Retiro
create or replace procedure cuenta_retirar(
    p_account_id varchar(30),
    p_tipo_mov int,
    p_moneda int,
    p_monto numeric(18,2),
    p_descripcion text default null
)
language plpgsql
as $$
declare v_saldo numeric(18,2);
begin
    if p_monto <= 0 then raise exception 'El monto debe ser positivo'; end if;
    select saldo into v_saldo from cuenta where account_id = p_account_id for update;
    if not found then raise exception 'Cuenta % no existe', p_account_id; end if;

    if v_saldo < p_monto then raise exception 'Saldo insuficiente'; end if;

    update cuenta set saldo = saldo - p_monto where account_id = p_account_id;
    insert into movimiento_cuenta (account_id, tipo, descripcion, moneda, monto)
    values (p_account_id, p_tipo_mov, coalesce(p_descripcion,'Retiro'), p_moneda, p_monto);
end;
$$;

-- Transferencia
create or replace procedure cuenta_transferir(
    p_account_id_origen varchar(30),
    p_account_id_destino varchar(30),
    p_tipo_mov int,
    p_moneda int,
    p_monto numeric(18,2),
    p_descripcion text default null
)
language plpgsql
as $$
declare v_saldo_origen numeric(18,2);
declare v_moneda_origen int;
declare v_moneda_destino int;
begin
    if p_monto <= 0 then raise exception 'El monto debe ser positivo'; end if;

    select saldo, moneda into v_saldo_origen, v_moneda_origen from cuenta where account_id = p_account_id_origen for update;
    select moneda into v_moneda_destino from cuenta where account_id = p_account_id_destino for update;

    if v_moneda_origen <> v_moneda_destino or v_moneda_origen <> p_moneda then
        raise exception 'Las monedas no coinciden entre cuentas';
    end if;

    if v_saldo_origen < p_monto then
        raise exception 'Saldo insuficiente en cuenta origen';
    end if;

    update cuenta set saldo = saldo - p_monto where account_id = p_account_id_origen;
    update cuenta set saldo = saldo + p_monto where account_id = p_account_id_destino;

    insert into movimiento_cuenta (account_id, tipo, descripcion, moneda, monto)
    values (p_account_id_origen, p_tipo_mov, coalesce(p_descripcion,'Transferencia salida'), p_moneda, p_monto);

    insert into movimiento_cuenta (account_id, tipo, descripcion, moneda, monto)
    values (p_account_id_destino, p_tipo_mov, coalesce(p_descripcion,'Transferencia entrada'), p_moneda, p_monto);
end;
$$;

-- Consultar movimientos
create or replace function select_movimiento_cuenta(
    p_usuario_documento int default null,
    p_account_id varchar(30) default null,
    p_fecha_desde timestamp default null,
    p_fecha_hasta timestamp default null
)
returns table (
    id int,
    account_id varchar(30),
    fecha timestamp,
    tipo int,
    descripcion text,
    moneda int,
    monto numeric(18,2)
)
language plpgsql
as $$
begin
    return query
    select mc.id, mc.account_id, mc.fecha, mc.tipo, mc.descripcion, mc.moneda, mc.monto
    from movimiento_cuenta mc
    join cuenta c on c.account_id = mc.account_id
    where (p_usuario_documento is null or c.usuario_documento = p_usuario_documento)
      and (p_account_id is null or mc.account_id = p_account_id)
      and (p_fecha_desde is null or mc.fecha >= p_fecha_desde)
      and (p_fecha_hasta is null or mc.fecha <= p_fecha_hasta)
    order by mc.fecha desc;
end;
$$;


-- Insertar tarjeta
create or replace procedure insert_tarjeta(
    p_card_id varchar(20),
    p_usuario_documento int,
    p_cuenta_id varchar(30),
    p_tipo int,
    p_numero_tarjeta varchar(25),
    p_exp varchar(7),
    p_moneda int,
    p_limite numeric(18,2) default 0,
    p_saldo numeric(18,2) default 0,
    p_pin_hash varchar(255) default null,
    p_cvv_hash varchar(255) default null
)
language plpgsql
as $$
begin
    if coalesce(p_limite,0) < 0 then
        raise exception 'El límite no puede ser negativo';
    end if;
    if coalesce(p_saldo,0) < 0 then
        raise exception 'El saldo de tarjeta no puede ser negativo';
    end if;

    insert into tarjeta (
        card_id, usuario_documento, cuenta_id, tipo, numero_tarjeta, exp, moneda,
        limite, saldo, pin_hash, cvv_hash
    ) values (
        p_card_id, p_usuario_documento, p_cuenta_id, p_tipo, p_numero_tarjeta, p_exp, p_moneda,
        coalesce(p_limite,0), coalesce(p_saldo,0), p_pin_hash, p_cvv_hash
    );
end;
$$;

-- Actualizar tarjeta
create or replace procedure update_tarjeta(
    p_card_id varchar(20),
    p_tipo int default null,
    p_exp varchar(7) default null,
    p_limite numeric(18,2) default null,
    p_pin_hash varchar(255) default null,
    p_cvv_hash varchar(255) default null
)
language plpgsql
as $$
declare v_saldo numeric(18,2);
begin
    if p_limite is not null and p_limite < 0 then
        raise exception 'El límite no puede ser negativo';
    end if;

    select saldo into v_saldo from tarjeta where card_id = p_card_id for update;
    if p_limite is not null and v_saldo > p_limite then
        raise exception 'No puede asignar límite menor al saldo actual';
    end if;

    update tarjeta
    set tipo = coalesce(p_tipo, tipo),
        exp = coalesce(nullif(p_exp,''), exp),
        limite = coalesce(p_limite, limite),
        pin_hash = coalesce(nullif(p_pin_hash,''), pin_hash),
        cvv_hash = coalesce(nullif(p_cvv_hash,''), cvv_hash)
    where card_id = p_card_id;
end;
$$;

-- Eliminar tarjeta
create or replace procedure delete_tarjeta(p_card_id varchar(20))
language plpgsql
as $$
declare v_saldo numeric(18,2);
begin
    select saldo into v_saldo from tarjeta where card_id = p_card_id for update;
    if not found then raise exception 'Tarjeta % no existe', p_card_id; end if;
    if v_saldo <> 0 then raise exception 'No puede eliminar tarjeta con saldo distinto de 0'; end if;
    delete from tarjeta where card_id = p_card_id;
end;
$$;



-- Consultar tarjetas
create or replace function select_tarjeta(
    p_usuario_documento int default null,
    p_cuenta_id varchar(30) default null
)
returns table (
    card_id varchar(20),
    usuario_documento int,
    cuenta_id varchar(30),
    tipo int,
    numero_tarjeta varchar(25),
    exp varchar(7),
    moneda int,
    limite numeric(18,2),
    saldo numeric(18,2)
)
language plpgsql
as $$
begin
    return query
    select t.card_id, t.usuario_documento, t.cuenta_id, t.tipo, t.numero_tarjeta,
           t.exp, t.moneda, t.limite, t.saldo
    from tarjeta t
    where (p_usuario_documento is null or t.usuario_documento = p_usuario_documento)
      and (p_cuenta_id is null or t.cuenta_id = p_cuenta_id)
    order by t.card_id;
end;
$$;


-- Verifica las credenciales del usuario (login).
CREATE OR REPLACE FUNCTION sp_auth_user_get_by_username_or_email(
    p_usuario VARCHAR(100),
    p_contrasena VARCHAR(255)
)
RETURNS TABLE (
    valido BOOLEAN,
    numero_documento INT,
    username VARCHAR(50),
    correo VARCHAR(100),
    rol INT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        (u.contrasena = crypt(p_contrasena, u.contrasena)) AS valido,
        u.numero_documento,
        u.username,
        u.correo,
        u.rol
    FROM usuario u
    WHERE u.username = p_usuario OR u.correo = p_usuario;
END;
$$;


-- Comprueba si una API Key está activa y es válida.
CREATE OR REPLACE FUNCTION sp_api_key_is_active(
    p_clave VARCHAR(255)
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_valida BOOLEAN := FALSE;
BEGIN
    SELECT TRUE
    INTO v_valida
    FROM api_key
    WHERE activa = TRUE
      AND clave_hash = crypt(p_clave, clave_hash)
    LIMIT 1;

    RETURN COALESCE(v_valida, FALSE);
END;
$$;


-- Genera y guarda un código OTP para un usuario y propósito.
CREATE OR REPLACE FUNCTION sp_otp_create(
    p_usuario INT,
    p_proposito VARCHAR(50)
)
RETURNS VARCHAR(6)
LANGUAGE plpgsql
AS $$
DECLARE
    v_codigo VARCHAR(6);
BEGIN
    v_codigo := lpad((trunc(random() * 999999))::text, 6, '0');
    INSERT INTO otp (usuario, codigo, proposito)
    VALUES (p_usuario, v_codigo, p_proposito);
    RETURN v_codigo;
END;
$$;

-- Valida y consume (marca como usado) un OTP válido.
CREATE OR REPLACE FUNCTION sp_otp_consume(
    p_usuario INT,
    p_codigo VARCHAR(6),
    p_proposito VARCHAR(50)
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_valido BOOLEAN := FALSE;
BEGIN
    SELECT TRUE
    INTO v_valido
    FROM otp
    WHERE usuario = p_usuario
      AND codigo = p_codigo
      AND proposito = p_proposito
      AND consumido = FALSE
      AND expira_en > NOW()
    LIMIT 1;

    IF v_valido THEN
        UPDATE otp
        SET consumido = TRUE
        WHERE usuario = p_usuario AND codigo = p_codigo;
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$;




-- Devuelve todos los usuarios o uno específico.
CREATE OR REPLACE FUNCTION select_usuario(
    p_numero_documento INT DEFAULT NULL
)
RETURNS TABLE (
    numero_documento INT,
    tipo_identificacion INT,
    nombre VARCHAR(50),
    apellido1 VARCHAR(50),
    apellido2 VARCHAR(50),
    username VARCHAR(50),
    fecha_nacimiento DATE,
    correo VARCHAR(100),
    telefono VARCHAR(25),
    contrasena VARCHAR(255),
    rol INT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.numero_documento, u.tipo_identificacion, u.nombre,
        u.apellido1, u.apellido2, u.username, u.fecha_nacimiento,
        u.correo, u.telefono, u.contrasena, u.rol
    FROM usuario u
    WHERE (p_numero_documento IS NULL OR u.numero_documento = p_numero_documento)
    ORDER BY u.numero_documento;
END;
$$;

CREATE OR REPLACE FUNCTION sp_verify_password(
  p_numero_documento INT,
  p_password TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_hash TEXT;
BEGIN
  SELECT contrasena INTO v_hash
  FROM usuario
  WHERE numero_documento = p_numero_documento;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- crypt(p_password, v_hash) genera el hash con la misma salt y lo compara
  RETURN v_hash = crypt(p_password, v_hash);
END;
$$;

-- Cambia el estado de una cuenta (activa, bloqueada, cerrada).
CREATE OR REPLACE PROCEDURE sp_accounts_set_status(
    p_account_id VARCHAR(30),
    p_nuevo_estado INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_saldo NUMERIC(18,2);
BEGIN
    SELECT saldo INTO v_saldo FROM cuenta WHERE account_id = p_account_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Cuenta % no existe', p_account_id;
    END IF;

    IF p_nuevo_estado = 3 AND v_saldo <> 0 THEN
        RAISE EXCEPTION 'No se puede cerrar una cuenta con saldo distinto de 0';
    END IF;

    UPDATE cuenta SET estado = p_nuevo_estado WHERE account_id = p_account_id;
END;
$$;


-- Inserta un movimiento de tarjeta (compra o pago).
CREATE OR REPLACE PROCEDURE sp_card_movement_add(
    p_card_id VARCHAR(20),
    p_tipo INT,
    p_moneda INT,
    p_monto NUMERIC(18,2),
    p_descripcion TEXT DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_limite NUMERIC(18,2);
    v_saldo NUMERIC(18,2);
BEGIN
    SELECT limite, saldo INTO v_limite, v_saldo
    FROM tarjeta
    WHERE card_id = p_card_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Tarjeta % no existe', p_card_id;
    END IF;

    IF p_monto <= 0 THEN
        RAISE EXCEPTION 'El monto debe ser positivo';
    END IF;

    
    IF p_tipo = 1 THEN
        IF v_saldo + p_monto > v_limite THEN
            RAISE EXCEPTION 'Límite de crédito excedido';
        END IF;
        UPDATE tarjeta SET saldo = saldo + p_monto WHERE card_id = p_card_id;
    ELSE
       
        UPDATE tarjeta SET saldo = saldo - p_monto WHERE card_id = p_card_id;
    END IF;

    INSERT INTO movimiento_tarjeta (card_id, tipo, descripcion, moneda, monto)
    VALUES (p_card_id, p_tipo, COALESCE(p_descripcion, 'Movimiento de tarjeta'), p_moneda, p_monto);
END;
$$;

-- Lista los movimientos de una tarjeta con filtros.
CREATE OR REPLACE FUNCTION sp_card_movements_list(
    p_card_id VARCHAR(20),
    p_fecha_desde TIMESTAMP DEFAULT NULL,
    p_fecha_hasta TIMESTAMP DEFAULT NULL,
    p_tipo INT DEFAULT NULL
)
RETURNS TABLE (
    id INT,
    card_id VARCHAR(20),
    fecha TIMESTAMP,
    tipo INT,
    descripcion TEXT,
    moneda INT,
    monto NUMERIC(18,2)
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT mt.id, mt.card_id, mt.fecha, mt.tipo, mt.descripcion, mt.moneda, mt.monto
    FROM movimiento_tarjeta mt
    WHERE mt.card_id = p_card_id
      AND (p_fecha_desde IS NULL OR mt.fecha >= p_fecha_desde)
      AND (p_fecha_hasta IS NULL OR mt.fecha <= p_fecha_hasta)
      AND (p_tipo IS NULL OR mt.tipo = p_tipo)
    ORDER BY mt.fecha DESC;
END;
$$;


-- Verifica si una cuenta existe y devuelve datos básicos del titular.
CREATE OR REPLACE FUNCTION sp_bank_validate_account(
    p_account_id VARCHAR(30)
)
RETURNS TABLE (
    existe BOOLEAN,
    titular_nombre VARCHAR(100),
    titular_correo VARCHAR(100),
    moneda VARCHAR(10),
    saldo NUMERIC(18,2)
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        TRUE::BOOLEAN,
        CONCAT(u.nombre, ' ', u.apellido1, ' ', u.apellido2)::VARCHAR(100),
        u.correo::VARCHAR(100),
        m.iso::VARCHAR(10),
        c.saldo::NUMERIC(18,2)
    FROM cuenta c
    JOIN usuario u ON u.numero_documento = c.usuario_documento
    JOIN moneda m ON m.id = c.moneda
    WHERE c.account_id = p_account_id;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE::BOOLEAN, NULL::VARCHAR(100), NULL::VARCHAR(100), NULL::VARCHAR(10), NULL::NUMERIC(18,2);
    END IF;
END;
$$;

--proceso para cambio de contrase
CREATE OR REPLACE PROCEDURE sp_usuario_cambiar_contrasena(
    p_numero_documento INT,
    p_nueva_contrasena VARCHAR(255)
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE usuario
    SET contrasena = crypt(p_nueva_contrasena, gen_salt('bf'))
    WHERE numero_documento = p_numero_documento;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Usuario con número de documento % no encontrado', p_numero_documento;
    END IF;
END;
$$;


-- Crud de la tabla de Rol
-- Insert Rol
create procedure insert_rol(
    p_nombre varchar(50),
    p_descripcion text
)
language plpgsql
as $$
begin
    insert into rol (nombre, descripcion)
    values (p_nombre, p_descripcion);
end;
$$;

-- Delete Rol

create procedure delete_rol(
    p_id integer
)
language plpgsql
as $$
begin
    delete from rol where id = p_id;
end;
$$;


-- Update Rol
create procedure update_rol(
    p_id integer,
    p_nombre varchar(50) default null,
    p_descripcion text default null
)
language plpgsql
as $$
begin
    update rol
    set 
        nombre = coalesce(nullif(p_nombre, ''), nombre),
        descripcion = coalesce(nullif(p_descripcion, ''), descripcion)
    where id = p_id;
end;
$$;

-- Select Rol
create function select_rol()
returns table (
    id integer,
    nombre varchar(50),
    descripcion text
)
language plpgsql
as $$
begin
    return query
    select r.id, r.nombre, r.descripcion
    from rol r;
end;
$$;





-- Crud de tipo_identificacion
-- Insert
create procedure insert_tipo_identificacion(
    p_nombre varchar(50),
    p_descripcion text
)
language plpgsql
as $$
begin
    insert into tipo_identificacion (nombre, descripcion)
    values (p_nombre, p_descripcion);
end;
$$;

-- Delete
create procedure delete_tipo_identificacion(
    p_id integer
)
language plpgsql
as $$
begin
    delete from tipo_identificacion
    where id = p_id;
end;
$$;

-- Update
create procedure update_tipo_identificacion(
    p_id integer,
    p_nombre varchar(50) default null,
    p_descripcion text default null
)
language plpgsql
as $$
begin
    update tipo_identificacion
    set 
        nombre = coalesce(nullif(p_nombre, ''), nombre),
        descripcion = coalesce(nullif(p_descripcion, ''), descripcion)
    where id = p_id;
end;
$$;

-- Select
create function select_tipo_identificacion()
returns table (
    id integer,
    nombre varchar(50),
    descripcion text
)
language plpgsql
as $$
begin
    return query
    select ti.id, ti.nombre, ti.descripcion
    from tipo_identificacion ti;
end;
$$;




-- Crud de moneda
-- Insert
create procedure insert_moneda(
    p_nombre varchar(50),
    p_iso varchar(10)
)
language plpgsql
as $$
begin
    insert into moneda (nombre, iso)
    values (p_nombre, p_iso);
end;
$$;

-- Delete
create procedure delete_moneda(
    p_id integer
)
language plpgsql
as $$
begin
    delete from moneda
    where id = p_id;
end;
$$;

-- Update
create procedure update_moneda(
    p_id integer,
    p_nombre varchar(50) default null,
    p_iso varchar(10) default null
)
language plpgsql
as $$
begin
    update moneda
    set 
        nombre = coalesce(nullif(p_nombre, ''), nombre),
        iso = coalesce(nullif(p_iso, ''), iso)
    where id = p_id;
end;
$$;

-- Select
create function select_moneda()
returns table (
    id integer,
    nombre varchar(50),
    iso varchar(10)
)
language plpgsql
as $$
begin
    return query
    select m.id, m.nombre, m.iso
    from moneda m
    order by m.id;
end;
$$;




--CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE OR REPLACE PROCEDURE insert_usuario(
    p_numero_documento INT,
    p_tipo_identificacion INT,
    p_nombre VARCHAR(50),
    p_apellido1 VARCHAR(50),
    p_apellido2 VARCHAR(50),
    p_username VARCHAR(50),
    p_fecha_nacimiento DATE,
    p_correo VARCHAR(100),
    p_telefono VARCHAR(25),
    p_contrasena VARCHAR(255),
    p_rol INT
)
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO usuario (
        numero_documento, tipo_identificacion, nombre, apellido1, apellido2,
        username, fecha_nacimiento, correo, telefono, contrasena, rol
    )
    VALUES (
        p_numero_documento, p_tipo_identificacion, p_nombre, p_apellido1, p_apellido2,
        p_username, p_fecha_nacimiento, p_correo, p_telefono,
        crypt(p_contrasena, gen_salt('bf')), 
        p_rol
    );
END;
$$;

-- delete 
create procedure delete_usuario(
    p_numero_documento int
)
language plpgsql
as $$
begin
    delete from usuario
    where numero_documento = p_numero_documento;
end;
$$;


CREATE OR REPLACE PROCEDURE update_usuario(
  p_numero_documento INT,
  p_nombre VARCHAR(50),
  p_apellido1 VARCHAR(50),
  p_correo VARCHAR(100),
  p_telefono VARCHAR(25)
)
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE usuario
  SET nombre = COALESCE(p_nombre, nombre),
      apellido1 = COALESCE(p_apellido1, apellido1),
      correo = COALESCE(p_correo, correo),
      telefono = COALESCE(p_telefono, telefono)
  WHERE numero_documento = p_numero_documento;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuario con número de documento % no encontrado', p_numero_documento;
  END IF;
END;
$$;






-- Crud tipo de cuenta
-- insert
create procedure insert_tipo_cuenta(
    p_nombre varchar(50)
)
language plpgsql
as $$
begin
    insert into tipo_cuenta (nombre)
    values (p_nombre);
end;
$$;

-- delete 
create procedure delete_tipo_cuenta(
    p_id integer
)
language plpgsql
as $$
begin
    delete from tipo_cuenta
    where id = p_id;
end;
$$;

-- update 
create procedure update_tipo_cuenta(
    p_id integer,
    p_nombre varchar(50) default null
)
language plpgsql
as $$
begin
    update tipo_cuenta
    set 
        nombre = coalesce(nullif(p_nombre, ''), nombre)
    where id = p_id;
end;
$$;

-- Select 
create function select_tipo_cuenta()
returns table (
    id integer,
    nombre varchar(50)
)
language plpgsql
as $$
begin
    return query
    select tc.id, tc.nombre
    from tipo_cuenta tc
    order by tc.id;
end;
$$;





--CRUD de estado_cuenta
-- insert
create procedure insert_estado_cuenta(
    p_nombre varchar(50)
)
language plpgsql
as $$
begin
    insert into estado_cuenta (nombre)
    values (p_nombre);
end;
$$;

-- delete 
create procedure delete_estado_cuenta(
    p_id integer
)
language plpgsql
as $$
begin
    delete from estado_cuenta
    where id = p_id;
end;
$$;

-- update 
create procedure update_estado_cuenta(
    p_id integer,
    p_nombre varchar(50) default null
)
language plpgsql
as $$
begin
    update estado_cuenta
    set 
        nombre = coalesce(nullif(p_nombre, ''), nombre)
    where id = p_id;
end;
$$;

-- Select 
create function select_estado_cuenta()
returns table (
    id integer,
    nombre varchar(50)
)
language plpgsql
as $$
begin
    return query
    select ec.id, ec.nombre
    from estado_cuenta ec
    order by ec.id;
end;
$$;


