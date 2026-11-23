-- Borrow start cannot be in the past. End must be at least 5 seconds after start.
-- Existing deals keep their dates; only new/changed borrow periods are checked.
-- Safe to re-run.

CREATE OR REPLACE FUNCTION public.offers_borrow_period_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_duration integer;
  v_unit text;
  v_max interval;
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

  SELECT lending_duration_value, lending_duration_unit
  INTO v_duration, v_unit
  FROM public.listings
  WHERE id = NEW.listing_id;

  IF v_duration IS NOT NULL AND v_duration > 0 AND v_unit IS NOT NULL THEN
    v_max := CASE v_unit
      WHEN 'Hours' THEN make_interval(hours => v_duration)
      WHEN 'Days' THEN make_interval(days => v_duration)
      WHEN 'Weeks' THEN make_interval(weeks => v_duration)
      ELSE NULL
    END;
    IF v_max IS NOT NULL AND NEW.end_at > NEW.start_at + v_max THEN
      RAISE EXCEPTION 'Borrow period cannot exceed the listing maximum of % %', v_duration, v_unit;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS offers_borrow_period_guard ON public.offers;
CREATE TRIGGER offers_borrow_period_guard
BEFORE INSERT OR UPDATE OF start_at, end_at, kind ON public.offers
FOR EACH ROW
EXECUTE FUNCTION public.offers_borrow_period_guard();
