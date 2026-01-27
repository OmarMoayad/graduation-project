-- Fix: Remove duplicate/conflicting policies and add INSERT policy for portal_users

-- Remove the duplicate stock_moves policy if it still exists
DROP POLICY IF EXISTS "stock_moves_require_auth" ON public.stock_moves;

-- Add INSERT policy for portal_users (needed for signup)
CREATE POLICY "Users can create their own portal profile"
ON public.portal_users
FOR INSERT
WITH CHECK (id = auth.uid());