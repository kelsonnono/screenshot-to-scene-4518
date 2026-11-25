CREATE TABLE public.route_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  target_price NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'TWD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT route_subscriptions_target_price_positive CHECK (target_price > 0),
  CONSTRAINT route_subscriptions_different_airports CHECK (origin <> destination),
  CONSTRAINT route_subscriptions_route_not_blank CHECK (length(trim(origin)) = 3 AND length(trim(destination)) = 3),
  CONSTRAINT route_subscriptions_one_watch_per_route UNIQUE (user_id, origin, destination, currency)
);

CREATE INDEX route_subscriptions_user_id_idx ON public.route_subscriptions (user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.route_subscriptions TO authenticated;
GRANT ALL ON public.route_subscriptions TO service_role;

ALTER TABLE public.route_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own route subscriptions"
ON public.route_subscriptions FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can add their own route subscriptions"
ON public.route_subscriptions FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can change their own route subscriptions"
ON public.route_subscriptions FOR UPDATE TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own route subscriptions"
ON public.route_subscriptions FOR DELETE TO authenticated
USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.route_subscriptions_touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER route_subscriptions_set_updated_at
BEFORE UPDATE ON public.route_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.route_subscriptions_touch_updated_at();