-- Buyer notification includes the seller reply text and has no View rating action.
-- A submitted reply cannot be edited.
-- Safe to re-run.

CREATE OR REPLACE FUNCTION public.set_rating_reply_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF OLD.seller_reply IS NOT NULL
     AND NEW.seller_reply IS DISTINCT FROM OLD.seller_reply THEN
    RAISE EXCEPTION 'Reply cannot be edited';
  END IF;
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

CREATE OR REPLACE FUNCTION public.notify_on_rating_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seller text;
  v_buyer text;
  v_title text;
BEGIN
  SELECT p.username INTO v_seller FROM public.profiles p WHERE p.id = NEW.seller_id;
  SELECT p.username INTO v_buyer FROM public.profiles p WHERE p.id = NEW.buyer_id;
  SELECT l.title INTO v_title
  FROM public.offers o
  JOIN public.listings l ON l.id = o.listing_id
  WHERE o.id = NEW.offer_id;

  IF NEW.seller_reply IS DISTINCT FROM OLD.seller_reply
     AND NEW.seller_reply IS NOT NULL
     AND OLD.seller_reply IS NULL THEN
    PERFORM public.notify_user(
      NEW.buyer_id,
      'Ratings',
      'Seller replied',
      format(
        E'@%s replied to your review of “%s”.\n%s',
        coalesce(v_seller, 'seller'),
        coalesce(v_title, 'your purchase'),
        NEW.seller_reply
      ),
      'star',
      'green'
    );
  END IF;

  IF NEW.flagged IS TRUE AND OLD.flagged IS DISTINCT FROM TRUE THEN
    PERFORM public.notify_admins(
      'Ratings',
      'Review flagged for moderation',
      format('@%s flagged a review from @%s on “%s”.', coalesce(v_seller, 'seller'), coalesce(v_buyer, 'buyer'), coalesce(v_title, 'a listing')),
      'x',
      'red',
      'View reviews'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ratings_notify_on_update ON public.ratings;
CREATE TRIGGER ratings_notify_on_update
AFTER UPDATE OF seller_reply, flagged ON public.ratings
FOR EACH ROW EXECUTE FUNCTION public.notify_on_rating_update();
