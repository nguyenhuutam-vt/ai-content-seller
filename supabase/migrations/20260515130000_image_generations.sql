-- Image generation history and atomic daily quota.
-- Free users get 2 images/day; Pro users get 20 images/day.

CREATE TABLE IF NOT EXISTS public.image_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  product_name text NOT NULL,
  style text NOT NULL,
  platform text NOT NULL,
  prompt text NOT NULL,
  image_data_url text NOT NULL,
  model text NOT NULL DEFAULT 'gpt-image-1',
  quality text NOT NULL DEFAULT 'low',
  size text NOT NULL DEFAULT '1024x1024',
  output_format text NOT NULL DEFAULT 'jpeg',
  usage jsonb,
  created_at timestamptz NOT NULL DEFAULT now ()
);

ALTER TABLE public.image_generations
  ADD COLUMN IF NOT EXISTS product_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS style text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS platform text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS prompt text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS image_data_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS model text NOT NULL DEFAULT 'gpt-image-1',
  ADD COLUMN IF NOT EXISTS quality text NOT NULL DEFAULT 'low',
  ADD COLUMN IF NOT EXISTS size text NOT NULL DEFAULT '1024x1024',
  ADD COLUMN IF NOT EXISTS output_format text NOT NULL DEFAULT 'jpeg',
  ADD COLUMN IF NOT EXISTS usage jsonb,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now ();

CREATE INDEX IF NOT EXISTS image_generations_user_created_at_idx
  ON public.image_generations (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS image_generations_user_prompt_created_at_idx
  ON public.image_generations (user_id, prompt, created_at DESC);

ALTER TABLE public.image_generations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own image generations"
  ON public.image_generations;

CREATE POLICY "Users can read own image generations"
  ON public.image_generations
  FOR SELECT
  TO authenticated
  USING (auth.uid () = user_id);

DROP POLICY IF EXISTS "Users can insert own image generations"
  ON public.image_generations;

CREATE POLICY "Users can insert own image generations"
  ON public.image_generations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid () = user_id);

REVOKE ALL ON public.image_generations FROM anon;
GRANT SELECT, INSERT ON public.image_generations TO authenticated;

CREATE TABLE IF NOT EXISTS public.image_generation_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now (),
  expires_at timestamptz NOT NULL,
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS image_generation_reservations_user_pending_idx
  ON public.image_generation_reservations (user_id)
  WHERE completed_at IS NULL;

ALTER TABLE public.image_generation_reservations ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.image_generation_reservations FROM anon;
REVOKE ALL ON public.image_generation_reservations FROM authenticated;

CREATE OR REPLACE FUNCTION public.reserve_image_generation_quota ()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid ();
  v_limit int;
  v_vn_date date;
  v_start timestamptz;
  v_end timestamptz;
  gen_count bigint;
  res_count bigint;
  rid uuid;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  END IF;

  PERFORM pg_advisory_xact_lock (hashtextextended (uid::text, 1));

  SELECT CASE WHEN lower(COALESCE(p.plan, 'free')) = 'pro' THEN 20 ELSE 2 END
    INTO v_limit
  FROM public.profiles p
  WHERE p.id = uid;

  IF NOT FOUND THEN
    v_limit := 2;
  END IF;

  v_vn_date := (timezone ('Asia/Ho_Chi_Minh', now ()))::date;
  v_start := v_vn_date::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh';
  v_end := v_start + interval '1 day';

  SELECT COUNT(*) INTO gen_count
  FROM public.image_generations g
  WHERE g.user_id = uid
    AND g.created_at >= v_start
    AND g.created_at < v_end;

  SELECT COUNT(*) INTO res_count
  FROM public.image_generation_reservations r
  WHERE r.user_id = uid
    AND r.completed_at IS NULL
    AND r.expires_at > now ()
    AND r.created_at >= v_start
    AND r.created_at < v_end;

  IF gen_count + res_count >= v_limit THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason', 'limit',
      'daily_limit', v_limit,
      'used_today', gen_count + res_count
    );
  END IF;

  INSERT INTO public.image_generation_reservations (user_id, expires_at)
  VALUES (uid, now () + interval '15 minutes')
  RETURNING id INTO rid;

  RETURN jsonb_build_object(
    'ok', true,
    'reservation_id', rid,
    'daily_limit', v_limit,
    'generation_count_before', gen_count
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.release_image_generation_reservation (
  p_reservation_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid () IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  DELETE FROM public.image_generation_reservations r
  WHERE r.id = p_reservation_id
    AND r.user_id = auth.uid ();
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_image_generation_quota () FROM PUBLIC;
REVOKE ALL ON FUNCTION public.release_image_generation_reservation (uuid)
  FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.reserve_image_generation_quota ()
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.release_image_generation_reservation (uuid)
  TO authenticated;
