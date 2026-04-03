-- Audit logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id UUID,
  action TEXT NOT NULL,  -- 'login', 'logout'
  metadata JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_store ON public.audit_logs(store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id, created_at DESC);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only store owner can read their own logs
CREATE POLICY "audit_logs_owner_read" ON public.audit_logs
  FOR SELECT USING (
    auth.uid() = user_id OR
    auth.uid() IN (SELECT user_id FROM public.stores WHERE id = store_id)
  );

CREATE POLICY "audit_logs_insert" ON public.audit_logs
  FOR INSERT WITH CHECK (true);
