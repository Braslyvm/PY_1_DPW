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

