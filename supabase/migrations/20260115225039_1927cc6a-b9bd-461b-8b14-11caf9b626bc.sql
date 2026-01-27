-- Add branch and address fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS branch TEXT,
ADD COLUMN IF NOT EXISTS address TEXT;