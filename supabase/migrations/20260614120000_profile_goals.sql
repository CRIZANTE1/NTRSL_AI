-- Metas nutricionais personalizadas por usuário
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS goal_kcal      integer NOT NULL DEFAULT 2000,
  ADD COLUMN IF NOT EXISTS goal_proteina  integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS goal_carbs     integer NOT NULL DEFAULT 250;

COMMENT ON COLUMN public.profiles.goal_kcal IS 'Meta diária de calorias consumidas (kcal)';
COMMENT ON COLUMN public.profiles.goal_proteina IS 'Meta diária de proteína (g)';
COMMENT ON COLUMN public.profiles.goal_carbs IS 'Meta diária de carboidratos (g)';
