
-- Players table
CREATE TABLE public.players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Games table
CREATE TABLE public.games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player1_id UUID NOT NULL REFERENCES public.players(id),
  player2_id UUID REFERENCES public.players(id),
  winner_id UUID REFERENCES public.players(id),
  mode TEXT NOT NULL DEFAULT '501',
  double_out BOOLEAN NOT NULL DEFAULT false,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  finished_at TIMESTAMP WITH TIME ZONE
);

-- Game turns table
CREATE TABLE public.game_turns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id),
  throw1 INTEGER,
  throw2 INTEGER,
  throw3 INTEGER,
  turn_score INTEGER NOT NULL DEFAULT 0,
  score_after INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Player stats table
CREATE TABLE public.player_stats (
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE PRIMARY KEY,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0
);

-- RLS policies (public app, no auth required)
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_turns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on players" ON public.players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on games" ON public.games FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on game_turns" ON public.game_turns FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on player_stats" ON public.player_stats FOR ALL USING (true) WITH CHECK (true);

-- Function to auto-create player_stats when a player is created
CREATE OR REPLACE FUNCTION public.create_player_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.player_stats (player_id, wins, losses) VALUES (NEW.id, 0, 0);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_player_created
  AFTER INSERT ON public.players
  FOR EACH ROW
  EXECUTE FUNCTION public.create_player_stats();
