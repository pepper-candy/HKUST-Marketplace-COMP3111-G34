-- Borrow start cannot be in the past. End must be at least 5 seconds after start.
-- Existing deals keep their dates; only new/changed borrow periods are checked.
-- Safe to re-run.

CREATE OR REPLACE FUNCTION public.offers_borrow_period_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.kind <> 'borrow' THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE'
     AND NEW.start_at IS NOT DISTINCT FROM OLD.start_at
     AND NEW.end_at IS NOT DISTINCT FROM OLD.end_at THEN
    RETURN NEW;
  END IF;
  IF NEW.start_at IS NULL OR NEW.end_at IS NULL THEN
    RAISE EXCEPTION 'Choose both a start and end date';
  END IF;
  IF NEW.start_at < date_trunc('second', now()) THEN
    RAISE EXCEPTION 'Start time cannot be in the past';
  END IF;
  IF NEW.end_at < NEW.start_at + interval '5 seconds' THEN
    RAISE EXCEPTION 'End time must be at least 5 seconds after the start time';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS offers_borrow_period_guard ON public.offers;
CREATE TRIGGER offers_borrow_period_guard
BEFORE INSERT OR UPDATE OF start_at, end_at, kind ON public.offers
FOR EACH ROW
EXECUTE FUNCTION public.offers_borrow_period_guard();
