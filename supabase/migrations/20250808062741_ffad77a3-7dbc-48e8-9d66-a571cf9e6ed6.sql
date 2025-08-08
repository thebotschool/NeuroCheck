-- Create users table for storing participant data
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  child_name TEXT,
  age INTEGER,
  email TEXT,
  consent_agreed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policy for users to see their own data
CREATE POLICY "Users can view their own data" 
ON public.users 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own data" 
ON public.users 
FOR INSERT 
WITH CHECK (true);

-- Update test_results table to include all test data
ALTER TABLE public.test_results 
ADD COLUMN IF NOT EXISTS user_data_id UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS hand_used TEXT DEFAULT 'left',
ADD COLUMN IF NOT EXISTS test_session_id TEXT,
ADD COLUMN IF NOT EXISTS result_summary TEXT;

-- Update promo_codes table to track usage better
ALTER TABLE public.promo_codes 
ADD COLUMN IF NOT EXISTS user_id TEXT,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Create sessions table for tracking test progress
CREATE TABLE public.test_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  current_step INTEGER DEFAULT 1,
  cpt_results JSONB,
  gonogo_results JSONB,
  memory_results JSONB,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  is_completed BOOLEAN DEFAULT false
);

-- Enable RLS on test_sessions
ALTER TABLE public.test_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for test_sessions
CREATE POLICY "Users can view their own sessions" 
ON public.test_sessions 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own sessions" 
ON public.test_sessions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own sessions" 
ON public.test_sessions 
FOR UPDATE 
USING (true);