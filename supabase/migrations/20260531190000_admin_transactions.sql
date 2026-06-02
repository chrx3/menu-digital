begin;

create or replace function public.is_business_admin(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.business_users
    where business_id = target_business_id
      and user_id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.replace_category_options_transaction(
  p_category_id uuid,
  p_options jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_business_id uuid;
begin
  select business_id into target_business_id
  from public.categories
  where id = p_category_id;

  if target_business_id is null or not public.is_business_admin(target_business_id) then
    raise exception 'No autorizado';
  end if;

  delete from public.category_options where category_id = p_category_id;

  insert into public.category_options (category_id, label, value, orden)
  select p_category_id, option_row.label, option_row.value, option_row.orden
  from jsonb_to_recordset(coalesce(p_options, '[]'::jsonb))
    as option_row(label text, value text, orden integer);
end;
$$;

create or replace function public.reorder_categories_transaction(
  p_business_id uuid,
  p_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_business_admin(p_business_id) then
    raise exception 'No autorizado';
  end if;

  if (
    select count(*) from public.categories
    where business_id = p_business_id and id = any(p_ids)
  ) <> cardinality(p_ids) then
    raise exception 'Una o más categorías no pertenecen al negocio';
  end if;

  update public.categories as category
  set orden = ordered.ordinality - 1
  from unnest(p_ids) with ordinality as ordered(id, ordinality)
  where category.id = ordered.id
    and category.business_id = p_business_id;
end;
$$;

create or replace function public.save_product_transaction(
  p_id uuid,
  p_category_id uuid,
  p_nombre text,
  p_slug text,
  p_imagen text,
  p_precio_unico integer,
  p_destacado boolean,
  p_tiene_estilo boolean,
  p_estilo_nombre text,
  p_estilo_opciones jsonb,
  p_incluye jsonb,
  p_incluye_texto text,
  p_orden integer,
  p_is_active boolean,
  p_ingredients jsonb,
  p_prices jsonb,
  p_promotions jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_business_id uuid;
  saved_product_id uuid;
begin
  select business_id into target_business_id
  from public.categories
  where id = p_category_id;

  if target_business_id is null or not public.is_business_admin(target_business_id) then
    raise exception 'No autorizado';
  end if;

  if p_id is null then
    insert into public.products (
      category_id, nombre, slug, imagen, precio_unico, destacado,
      tiene_estilo, estilo_nombre, estilo_opciones, incluye, incluye_texto,
      orden, is_active
    ) values (
      p_category_id, p_nombre, p_slug, nullif(p_imagen, ''), p_precio_unico, p_destacado,
      p_tiene_estilo, p_estilo_nombre, p_estilo_opciones, p_incluye, nullif(p_incluye_texto, ''),
      p_orden, p_is_active
    )
    returning id into saved_product_id;
  else
    update public.products as product
    set category_id = p_category_id,
        nombre = p_nombre,
        slug = p_slug,
        imagen = nullif(p_imagen, ''),
        precio_unico = p_precio_unico,
        destacado = p_destacado,
        tiene_estilo = p_tiene_estilo,
        estilo_nombre = p_estilo_nombre,
        estilo_opciones = p_estilo_opciones,
        incluye = p_incluye,
        incluye_texto = nullif(p_incluye_texto, ''),
        orden = p_orden,
        is_active = p_is_active,
        updated_at = now()
    from public.categories as previous_category
    where product.id = p_id
      and previous_category.id = product.category_id
      and previous_category.business_id = target_business_id
    returning product.id into saved_product_id;

    if saved_product_id is null then
      raise exception 'Producto inválido';
    end if;
  end if;

  delete from public.product_ingredients where product_id = saved_product_id;
  insert into public.product_ingredients (product_id, nombre, orden)
  select saved_product_id, ingredient.value, ingredient.ordinality - 1
  from jsonb_array_elements_text(coalesce(p_ingredients, '[]'::jsonb))
    with ordinality as ingredient(value, ordinality);

  delete from public.product_prices where product_id = saved_product_id;
  insert into public.product_prices (product_id, option_value, precio, orden)
  select saved_product_id,
         price.value ->> 'option_value',
         (price.value ->> 'precio')::integer,
         price.ordinality - 1
  from jsonb_array_elements(coalesce(p_prices, '[]'::jsonb))
    with ordinality as price(value, ordinality);

  delete from public.promotions where product_id = saved_product_id;
  insert into public.promotions (product_id, type, label, option_value, precio, is_active)
  select saved_product_id,
         coalesce(promotion.type, 'promo_2x'),
         case when coalesce(promotion.type, 'promo_2x') = 'promo_2x' then 'Promo 2x' else promotion.type end,
         promotion.option_value,
         promotion.precio,
         true
  from jsonb_to_recordset(coalesce(p_promotions, '[]'::jsonb))
    as promotion(type text, option_value text, precio integer);

  return saved_product_id;
end;
$$;

revoke all on function public.replace_category_options_transaction(uuid, jsonb) from public;
revoke all on function public.reorder_categories_transaction(uuid, uuid[]) from public;
revoke all on function public.save_product_transaction(uuid, uuid, text, text, text, integer, boolean, boolean, text, jsonb, jsonb, text, integer, boolean, jsonb, jsonb, jsonb) from public;

grant execute on function public.replace_category_options_transaction(uuid, jsonb) to authenticated;
grant execute on function public.reorder_categories_transaction(uuid, uuid[]) to authenticated;
grant execute on function public.save_product_transaction(uuid, uuid, text, text, text, integer, boolean, boolean, text, jsonb, jsonb, text, integer, boolean, jsonb, jsonb, jsonb) to authenticated;

commit;
