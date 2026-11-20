-- Track which participant most recently changed an open offer.
-- This prevents a seller from acting on their own offer or counter before the buyer responds.
-- Safe to re-run.

ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS last_action_by text
  CHECK (last_action_by IN ('buyer', 'seller'));

UPDATE public.offers o
SET last_action_by = CASE
  WHEN latest.sender_id = l.seller_id THEN 'seller'
  WHEN latest.sender_id = o.buyer_id THEN 'buyer'
END
FROM public.listings l,
LATERAL (
  SELECT m.sender_id
  FROM public.chat_messages m
  WHERE m.offer_id = o.id
    AND m.kind = 'offer'
  ORDER BY m.created_at DESC, m.id DESC
  LIMIT 1
) AS latest
WHERE o.listing_id = l.id
  AND o.status IN ('pending', 'countered')
  AND o.last_action_by IS NULL;

CREATE OR REPLACE FUNCTION public.set_offer_last_action_by()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seller_id uuid;
BEGIN
  IF TG_OP = 'UPDATE'
  AND auth.uid() = (
    SELECT seller_id
    FROM public.listings
    WHERE id = OLD.listing_id
  )
  AND OLD.last_action_by = 'seller'
  AND OLD.status IN ('pending', 'countered')
  AND NOT (
    NEW.status = 'declined'
    AND NEW.detail LIKE '%Automatically declined because another request was accepted'
  ) THEN
    RAISE EXCEPTION 'You cannot act on your own offer until the buyer responds';
  END IF;

  SELECT seller_id INTO v_seller_id
  FROM public.listings
  WHERE id = NEW.listing_id;

  IF auth.uid() = v_seller_id THEN
    NEW.last_action_by := 'seller';
  ELSIF auth.uid() = NEW.buyer_id THEN
    NEW.last_action_by := 'buyer';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS offers_set_last_action_by ON public.offers;
CREATE TRIGGER offers_set_last_action_by
BEFORE INSERT OR UPDATE OF status, price, start_at, end_at, detail
ON public.offers
FOR EACH ROW
EXECUTE FUNCTION public.set_offer_last_action_by();
