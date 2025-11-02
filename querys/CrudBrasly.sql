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

-- delete Rol
create procedure delete_rol(
    U_id INTEGER
)
language plpgsql
as $$
begin
    delete from rol Where id = U_id;
end;
$$;


-- update Rol
create or replace procedure update_rol(
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
    select id, nombre, descripcion
    from rol;
end;
$$;




-- Crud de tipo_identificacion
-- insert 
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

--delete 
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

-- update 
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

-- select 
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
    select id, nombre, descripcion
    from tipo_identificacion;
end;
$$;

