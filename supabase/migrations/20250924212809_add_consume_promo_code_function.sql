-- Создаём функцию consume_promo_code
create or replace function public.consume_promo_code(promo_code_to_consume text)
returns table (
  new_test_token text,
  error_code text,
  error_message text
)
language plpgsql
as $$
declare
  v_token text;
begin
  -- Проверяем, что промокод активный
  if not exists (
    select 1 from public.promo_codes
    where code = promo_code_to_consume
      and is_used = false
      and is_active = true
      and (expires_at is null or expires_at > now())
  ) then
    return query select null::text, 'PROMO_NOT_FOUND'::text, 'Промокод не найден или уже использован'::text;
    return;
  end if;

  -- Генерируем токен
  v_token := encode(gen_random_bytes(16), 'hex');

  -- Создаём тест
  insert into public.tests(token, promo_code_used)
  values (v_token, promo_code_to_consume);

  -- Помечаем промокод использованным
  update public.promo_codes
  set is_used = true,
      times_used = times_used + 1
  where code = promo_code_to_consume;

  -- Возвращаем токен
  return query select v_token, null::text, null::text;
end;
$$;

-- (необязательно) дать права анонимному ключу на вызов
grant execute on function public.consume_promo_code(text) to anon;
grant execute on function public.consume_promo_code(text) to authenticated;
