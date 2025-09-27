-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.payments (
  payment_id text NOT NULL,
  status text,
  amount numeric,
  timestamp timestamp without time zone,
  email text,
  metadata jsonb DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone DEFAULT now(),
  currency text,
  description text,
  CONSTRAINT payments_pkey PRIMARY KEY (payment_id)
);
CREATE TABLE public.promo_codes (
  code text NOT NULL,
  is_used boolean NOT NULL DEFAULT false,
  user_id text,
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  max_uses integer NOT NULL DEFAULT 1,
  times_used integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  discount_type text,
  discount_value numeric,
  metadata jsonb,
  CONSTRAINT promo_codes_pkey PRIMARY KEY (code)
);
CREATE TABLE public.tests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  current_step integer DEFAULT 1,
  tcp_results jsonb,
  gonogo_results jsonb,
  memory_results jsonb,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  is_completed boolean DEFAULT false,
  payment_id text UNIQUE,
  expires_at timestamp with time zone,
  token text UNIQUE,
  age integer,
  email text,
  used boolean NOT NULL DEFAULT false,
  client_id text,
  promo_code_used text,
  CONSTRAINT tests_pkey PRIMARY KEY (id),
  CONSTRAINT fk_promo_code FOREIGN KEY (promo_code_used) REFERENCES public.promo_codes(code)
);
CREATE SEQUENCE IF NOT EXISTS public.yookassa_webhook_events_id_seq;

CREATE TABLE public.yookassa_webhook_events (
  id bigint NOT NULL DEFAULT nextval('public.yookassa_webhook_events_id_seq'::regclass),
  event_type text NOT NULL,
  payment_id text,
  payload jsonb NOT NULL,
  received_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT yookassa_webhook_events_pkey PRIMARY KEY (id)
);
