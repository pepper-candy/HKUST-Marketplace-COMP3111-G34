CREATE OR REPLACE FUNCTION public.set_rating_reply_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.seller_reply IS DISTINCT FROM OLD.seller_reply
     AND NEW.seller_reply IS NOT NULL THEN
    NEW.replied_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ratings_reply_timestamp ON public.ratings;
CREATE TRIGGER ratings_reply_timestamp
BEFORE UPDATE OF seller_reply ON public.ratings
FOR EACH ROW EXECUTE FUNCTION public.set_rating_reply_timestamp();
