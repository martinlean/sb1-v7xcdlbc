-- Grant necessary permissions on auth schema
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA auth TO anon;

-- Grant necessary permissions on auth.users
GRANT SELECT ON auth.users TO authenticated;
GRANT SELECT ON auth.users TO anon;

-- Ensure public schema permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant ALL on products table
GRANT ALL ON public.products TO authenticated;
GRANT ALL ON public.products TO anon;

-- Disable RLS on products temporarily for testing
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;

-- Update product trigger to be more permissive
CREATE OR REPLACE FUNCTION public.set_product_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Make user_id optional by using COALESCE
  NEW.user_id = COALESCE(NEW.user_id, auth.uid(), (SELECT id FROM auth.users LIMIT 1));
  NEW.billing_name = COALESCE(NEW.billing_name, NEW.name);
  NEW.support_email = COALESCE(NEW.support_email, 'suporte@rewardsmidia.online');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;