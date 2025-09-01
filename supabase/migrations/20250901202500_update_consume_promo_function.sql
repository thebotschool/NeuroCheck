CREATE OR REPLACE FUNCTION public.consume_promo_code(promo_code_to_consume TEXT)
RETURNS TABLE(new_test_token TEXT, error_message TEXT, error_code TEXT) AS $$
DECLARE
  promo_record RECORD;
  newly_created_test RECORD;
BEGIN
  -- Find the promo code and lock the row for update to prevent race conditions
  SELECT * INTO promo_record FROM public.promo_codes WHERE code = promo_code_to_consume FOR UPDATE;

  -- Validate the promo code
  IF promo_record IS NULL THEN
    RETURN QUERY SELECT NULL, 'Промокод не найден', 'not_found';
    RETURN;
  END IF;

  IF NOT promo_record.is_active THEN
    RETURN QUERY SELECT NULL, 'Промокод неактивен', 'inactive';
    RETURN;
  END IF;

  IF promo_record.expires_at IS NOT NULL AND promo_record.expires_at < now() THEN
    RETURN QUERY SELECT NULL, 'Срок действия промокода истек', 'expired';
    RETURN;
  END IF;

  IF promo_record.times_used >= promo_record.max_uses THEN
    RETURN QUERY SELECT NULL, 'Промокод уже был использован максимальное количество раз', 'limit_reached';
    RETURN;
  END IF;

  -- If validation passes, consume the code and create a test
  UPDATE public.promo_codes
  SET times_used = times_used + 1
  WHERE code = promo_code_to_consume;

  -- MODIFIED: Added promo_code_used to the insert
  INSERT INTO public.tests (token, promo_code_used)
  VALUES (gen_random_uuid()::text, promo_code_to_consume)
  RETURNING token INTO newly_created_test;

  RETURN QUERY SELECT newly_created_test.token, NULL, NULL;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;