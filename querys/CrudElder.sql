


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
