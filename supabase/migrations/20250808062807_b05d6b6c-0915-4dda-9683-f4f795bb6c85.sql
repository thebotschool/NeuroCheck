-- Fix RLS policies for existing tables

-- Add policies for messages_queue table
ALTER TABLE public.messages_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to messages_queue" 
ON public.messages_queue 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Add policies for payments table
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to payments" 
ON public.payments 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Add policies for promo_codes table
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to promo_codes" 
ON public.promo_codes 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Add policies for test_results table
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to test_results" 
ON public.test_results 
FOR ALL 
USING (true) 
WITH CHECK (true);