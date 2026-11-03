-- Water hardness must be nullable and carry explicit input provenance.
-- Historical 150 ppm values were written as an application default and cannot
-- be distinguished from measured/user-entered values; conservatively invalidate them.
ALTER TABLE public.formulas
  ALTER COLUMN water_hardness_ppm DROP NOT NULL,
  ALTER COLUMN water_hardness_ppm DROP DEFAULT;

ALTER TABLE public.formulas
  ADD COLUMN IF NOT EXISTS water_hardness_source text NOT NULL DEFAULT 'UNKNOWN';

UPDATE public.formulas
SET water_hardness_ppm = NULL
WHERE water_hardness_source = 'UNKNOWN'
  AND water_hardness_ppm = 150;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'formulas_water_hardness_source_check'
      AND conrelid = 'public.formulas'::regclass
  ) THEN
    ALTER TABLE public.formulas
      ADD CONSTRAINT formulas_water_hardness_source_check
      CHECK (water_hardness_source IN ('USER_ENTERED', 'MEASURED', 'UNKNOWN'));
  END IF;
END $$;
