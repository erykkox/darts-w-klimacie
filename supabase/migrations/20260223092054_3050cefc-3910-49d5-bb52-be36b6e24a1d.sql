
ALTER TABLE public.games 
  ADD COLUMN in_mode text NOT NULL DEFAULT 'straight_in',
  ADD COLUMN out_mode text NOT NULL DEFAULT 'straight_out',
  ADD COLUMN legs_target integer NOT NULL DEFAULT 1,
  ADD COLUMN sets_target integer NOT NULL DEFAULT 1,
  ADD COLUMN legs_mode text NOT NULL DEFAULT 'first_to',
  ADD COLUMN sets_mode text NOT NULL DEFAULT 'first_to';

-- Migrate existing data: if double_out was true, set out_mode to double_out
UPDATE public.games SET out_mode = 'double_out' WHERE double_out = true;
