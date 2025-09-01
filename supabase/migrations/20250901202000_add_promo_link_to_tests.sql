-- Add promo_code_used column to tests table
ALTER TABLE public.tests
ADD COLUMN promo_code_used TEXT NULL;

-- Add foreign key constraint to link to the promo_codes table
ALTER TABLE public.tests
ADD CONSTRAINT fk_promo_code
FOREIGN KEY (promo_code_used)
REFERENCES public.promo_codes(code)
ON DELETE SET NULL; -- If a promo code is deleted, don't delete the test record
