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




-- insert
-- delete 
-- update 
-- Select 





-- insert
-- delete 
-- update 
-- Select 





-- insert
-- delete 
-- update 
-- Select 





-- insert
-- delete 
-- update 
-- Select 




-- insert
-- delete 
-- update
 -- Select 