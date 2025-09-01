CREATE TABLE public.promo_codes (
  code TEXT NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT false,
  user_id TEXT NULL,
  expires_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT promo_codes_pkey PRIMARY KEY (code)
);
