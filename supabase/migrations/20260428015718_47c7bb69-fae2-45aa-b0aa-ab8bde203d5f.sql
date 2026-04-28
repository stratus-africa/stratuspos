
-- Tills (registers) per business
CREATE TABLE IF NOT EXISTS public.tills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  location_id uuid,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tills ENABLE ROW LEVEL SECURITY;

CREATE POLICY tills_select ON public.tills
FOR SELECT TO public
USING (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY tills_insert ON public.tills
FOR INSERT TO public
WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY tills_update ON public.tills
FOR UPDATE TO public
USING (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY tills_delete ON public.tills
FOR DELETE TO public
USING (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY tills_super_admin_select ON public.tills
FOR SELECT TO authenticated
USING (public.is_super_admin(auth.uid()));

CREATE TRIGGER tills_set_updated_at
BEFORE UPDATE ON public.tills
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Assignment of users to tills lives on user_roles
ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS till_id uuid;
