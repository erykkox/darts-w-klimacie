
CREATE OR REPLACE FUNCTION public.create_player_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.player_stats (player_id, wins, losses) VALUES (NEW.id, 0, 0);
  RETURN NEW;
END;
$$;
