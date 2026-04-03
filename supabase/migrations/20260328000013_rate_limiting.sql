-- Rate limiting table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL,  -- phone or IP
  action TEXT NOT NULL,       -- 'order', 'track', 'coupon'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON public.rate_limits(identifier, action, created_at);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rate_limits_public" ON public.rate_limits FOR ALL USING (true) WITH CHECK (true);

-- Function: check and record rate limit
-- Returns true if allowed, false if blocked
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_identifier TEXT,
  p_action TEXT,
  p_max_requests INT DEFAULT 5,
  p_window_minutes INT DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INT;
BEGIN
  -- Count requests in window
  SELECT COUNT(*) INTO v_count
  FROM public.rate_limits
  WHERE identifier = p_identifier
    AND action = p_action
    AND created_at > now() - (p_window_minutes || ' minutes')::INTERVAL;

  IF v_count >= p_max_requests THEN
    RETURN FALSE;
  END IF;

  -- Record this request
  INSERT INTO public.rate_limits (identifier, action)
  VALUES (p_identifier, p_action);

  -- Cleanup old records (keep last 24h only)
  DELETE FROM public.rate_limits
  WHERE created_at < now() - INTERVAL '24 hours';

  RETURN TRUE;
END;
$$;

-- Apply rate limit to orders: max 10 orders per phone per hour
CREATE OR REPLACE FUNCTION check_order_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_allowed BOOLEAN;
BEGIN
  SELECT check_rate_limit(NEW.phone, 'order', 10, 60) INTO v_allowed;
  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Muitos pedidos em pouco tempo. Aguarde antes de tentar novamente.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_rate_limit ON public.orders;
CREATE TRIGGER trg_order_rate_limit
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION check_order_rate_limit();
