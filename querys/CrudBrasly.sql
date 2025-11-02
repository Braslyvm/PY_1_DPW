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
        tipo_identificacion, nombre, apellido1, apellido2,
        username, fecha_nacimiento, correo, telefono, contrasena, rol
    )
    VALUES (
        p_tipo_identificacion, p_nombre, p_apellido1, p_apellido2,
        p_username, p_fecha_nacimiento, p_correo, p_telefono,
        crypt(p_contrasena, gen_salt('bf')),  -- 🔒 Aquí se genera el hash bcrypt
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

-- update 
create procedure update_usuario(
    p_numero_documento int,
    p_tipo_identificacion int default null,
    p_nombre varchar(50) default null,
    p_apellido1 varchar(50) default null,
    p_apellido2 varchar(50) default null,
    p_username varchar(50) default null,
    p_fecha_nacimiento date default null,
    p_correo varchar(100) default null,
    p_telefono varchar(25) default null,
    p_contrasena varchar(255) default null,
    p_rol int default null
)
language plpgsql
as $$
begin
    update usuario
    set
        tipo_identificacion = coalesce(p_tipo_identificacion, tipo_identificacion),
        nombre = coalesce(nullif(p_nombre, ''), nombre),
        apellido1 = coalesce(nullif(p_apellido1, ''), apellido1),
        apellido2 = coalesce(nullif(p_apellido2, ''), apellido2),
        username = coalesce(nullif(p_username, ''), username),
        fecha_nacimiento = coalesce(p_fecha_nacimiento, fecha_nacimiento),
        correo = coalesce(nullif(p_correo, ''), correo),
        telefono = coalesce(nullif(p_telefono, ''), telefono),
        contrasena = coalesce(nullif(p_contrasena, ''), contrasena),
        rol = coalesce(p_rol, rol)
    where numero_documento = p_numero_documento;
end;
$$;

-- Select 
create function select_usuario()
returns table (
    numero_documento int,
    tipo_identificacion int,
    nombre varchar(50),
    apellido1 varchar(50),
    apellido2 varchar(50),
    username varchar(50),
    fecha_nacimiento date,
    correo varchar(100),
    telefono varchar(25),
    contrasena varchar(255),
    rol int
)
language plpgsql
as $$
begin
    return query
    select u.numero_documento, u.tipo_identificacion, u.nombre, u.apellido1,u.apellido2,u.username,u.fecha_nacimiento,u.correo,u.telefono,u.contrasena,u.rol
    from usuario u
    order by u.numero_documento;
end;
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


