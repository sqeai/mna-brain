-- ============================================================================
-- Normalize companies + adopt subset of sql_schema_redesigned_claude.sql
-- ============================================================================
-- Summary of effects:
--   * New enums: pipeline_stage, company_status, deal_origin,
--     analysis_job_status, l1_result
--   * New tables: company_financials, company_fx_adjustments,
--     company_screening_derived, user_company_favorites
--   * Backfill pivoted from wide columns on companies; user favorites pivoted
--     from users.favorite_companies (jsonb array of uuid strings)
--   * Drops ~40 wide columns on companies (revenue/ebitda/ev/fx/l0/l1/segment)
--   * Drops users.favorite_companies
--   * Cast companies.pipeline_stage/status/source and company_analyses.status
--     to their respective enums. Unknown values coerced to NULL (status/source)
--     or 'L0'/'pending' (pipeline_stage / analysis status) — see migration_notices.
--   * deal_stage_history.duration_seconds becomes GENERATED ALWAYS AS ... STORED
--
-- Intentionally OUT of scope (despite being listed in the redesigned SQL):
--   * company_logs restructure (kept wide-column shape, UI depends on it)
--   * deal_id → company_id rename on deal_* tables (kept deal_id)
--   * users.password → password_hash rename, users.email lower() CHECK
--   * inven_cache, investment_thesis, past_acquisitions, criterias/screenings,
--     company_slides, files, file_company_matches, companies_flat view
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Enums (idempotent)
-- ----------------------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE pipeline_stage AS ENUM ('market_screening','L0','L1','L2','L3','L4','L5');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE company_status AS ENUM ('active','dropped');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE deal_origin AS ENUM ('inbound','outbound');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE analysis_job_status AS ENUM ('pending','processing','completed','failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE l1_result AS ENUM ('pass','fail','inconclusive');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------------------------------------------
-- 2. Scratch table for backfill coercion notices (review after migrate)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS migration_notices (
  id           bigserial   PRIMARY KEY,
  migration    text        NOT NULL,
  table_name   text        NOT NULL,
  row_id       uuid,
  column_name  text,
  original_value text,
  reason       text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 3. New tables
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS company_financials (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id            uuid        NOT NULL REFERENCES companies (id) ON DELETE CASCADE,
  fiscal_year           integer     NOT NULL,
  revenue_usd_mn        numeric,
  ebitda_usd_mn         numeric,
  ev_usd_mn             numeric,
  ebitda_margin         numeric,
  ev_ebitda             numeric,
  revenue_cagr_vs_prior numeric,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT company_financials_year_chk          CHECK (fiscal_year BETWEEN 1990 AND 2100),
  CONSTRAINT company_financials_company_year_uniq UNIQUE (company_id, fiscal_year)
);

CREATE INDEX IF NOT EXISTS idx_company_financials_company_id
  ON company_financials (company_id);

CREATE TRIGGER update_company_financials_updated_at
  BEFORE UPDATE ON company_financials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


CREATE TABLE IF NOT EXISTS company_fx_adjustments (
  company_id            uuid        NOT NULL REFERENCES companies (id) ON DELETE CASCADE,
  fiscal_year           integer     NOT NULL,
  currency              text        NOT NULL,
  revenue_local         numeric,
  assumed_forex         numeric,
  forex_change_vs_prior numeric,
  revenue_cagr_domestic numeric,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT company_fx_adjustments_year_chk CHECK (fiscal_year BETWEEN 1990 AND 2100),
  PRIMARY KEY (company_id, fiscal_year)
);

CREATE TRIGGER update_company_fx_adjustments_updated_at
  BEFORE UPDATE ON company_fx_adjustments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


CREATE TABLE IF NOT EXISTS company_screening_derived (
  company_id                      uuid        PRIMARY KEY REFERENCES companies (id) ON DELETE CASCADE,

  -- L0
  segment_revenue                 numeric,
  segment_ebitda                  numeric,
  segment_revenue_total_ratio     numeric,
  l0_ebitda_2024_usd_mn           numeric,
  l0_ev_2024_usd_mn               numeric,
  l0_revenue_2024_usd_mn          numeric,
  l0_ev_ebitda_2024               numeric,
  segment_specific_revenue_pct    numeric,
  combined_segment_revenue        text,
  pct_from_domestic               numeric,
  l0_ev_usd_mn                    numeric,
  revenue_from_priority_geo       boolean,

  -- L1
  l1_revenue_cagr_l3y             numeric,
  l1_revenue_drop_count           integer,
  l1_ebitda_below_threshold_count integer,
  l1_revenue_cagr_n3y             numeric,
  l1_vision_fit                   boolean,
  l1_priority_geo                 boolean,
  l1_ev_below_threshold           boolean,
  l1_revenue_no_consecutive_drop  boolean,
  l1_rationale                    text,
  l1_screening_result             l1_result,

  -- FX summary (per-year detail lives in company_fx_adjustments)
  fx_currency                     text,
  fx_revenue_drop_count           integer,
  fx_revenue_no_consecutive_drop  boolean,
  fx_ebitda_above_10_l3y          boolean,
  fx_rationale                    text,

  computed_at                     timestamptz,
  updated_at                      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_company_screening_derived_l1_result
  ON company_screening_derived (l1_screening_result);

CREATE TRIGGER update_company_screening_derived_updated_at
  BEFORE UPDATE ON company_screening_derived
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


CREATE TABLE IF NOT EXISTS user_company_favorites (
  user_id    uuid        NOT NULL REFERENCES users     (id) ON DELETE CASCADE,
  company_id uuid        NOT NULL REFERENCES companies (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, company_id)
);

CREATE INDEX IF NOT EXISTS idx_user_company_favorites_company_id
  ON user_company_favorites (company_id);

-- ----------------------------------------------------------------------------
-- 4. Backfill: company_financials (pivot 4 years per company)
--     ev_usd_mn / ev_ebitda are only known for 2024 in the source shape.
-- ----------------------------------------------------------------------------

INSERT INTO company_financials
  (company_id, fiscal_year, revenue_usd_mn, ebitda_usd_mn, ev_usd_mn, ebitda_margin, ev_ebitda, revenue_cagr_vs_prior)
SELECT id, 2021, revenue_2021_usd_mn, ebitda_2021_usd_mn, NULL::numeric, ebitda_margin_2021, NULL::numeric,  NULL::numeric          FROM companies
UNION ALL
SELECT id, 2022, revenue_2022_usd_mn, ebitda_2022_usd_mn, NULL::numeric, ebitda_margin_2022, NULL::numeric,  revenue_cagr_2021_2022 FROM companies
UNION ALL
SELECT id, 2023, revenue_2023_usd_mn, ebitda_2023_usd_mn, NULL::numeric, ebitda_margin_2023, NULL::numeric,  revenue_cagr_2022_2023 FROM companies
UNION ALL
SELECT id, 2024, revenue_2024_usd_mn, ebitda_2024_usd_mn, ev_2024,       ebitda_margin_2024, ev_ebitda_2024, revenue_cagr_2023_2024 FROM companies
ON CONFLICT (company_id, fiscal_year) DO NOTHING;

-- Prune rows with no data (avoid inflating the table for companies that had no financials)
DELETE FROM company_financials
 WHERE revenue_usd_mn IS NULL
   AND ebitda_usd_mn IS NULL
   AND ev_usd_mn IS NULL
   AND ebitda_margin IS NULL
   AND ev_ebitda IS NULL
   AND revenue_cagr_vs_prior IS NULL;

-- ----------------------------------------------------------------------------
-- 5. Backfill: company_fx_adjustments (pivot 4 years, year-shifted change/cagr)
--     PK is (company_id, fiscal_year). Skip all-NULL rows via WHERE filters.
--     fx_currency is required (NOT NULL on the new table), so any year-row
--     without a currency is skipped.
-- ----------------------------------------------------------------------------

INSERT INTO company_fx_adjustments
  (company_id, fiscal_year, currency, revenue_local, assumed_forex, forex_change_vs_prior, revenue_cagr_domestic)
SELECT id, 2021, fx_currency, fx_revenue_2021, fx_assumed_forex_2021, NULL::numeric,             NULL::numeric                      FROM companies WHERE fx_currency IS NOT NULL
UNION ALL
SELECT id, 2022, fx_currency, fx_revenue_2022, fx_assumed_forex_2022, fx_forex_change_2021_2022, fx_revenue_cagr_domestic_2021_2022 FROM companies WHERE fx_currency IS NOT NULL
UNION ALL
SELECT id, 2023, fx_currency, fx_revenue_2023, fx_assumed_forex_2023, fx_forex_change_2022_2023, fx_revenue_cagr_domestic_2022_2023 FROM companies WHERE fx_currency IS NOT NULL
UNION ALL
SELECT id, 2024, fx_currency, fx_revenue_2024, fx_assumed_forex_2024, fx_forex_change_2023_2024, fx_revenue_cagr_domestic_2023_2024 FROM companies WHERE fx_currency IS NOT NULL
ON CONFLICT (company_id, fiscal_year) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 6. Backfill: company_screening_derived (one row per company with screening data)
--     Text-flag → boolean via strict mapping. Unmapped values log to migration_notices.
-- ----------------------------------------------------------------------------

-- Inline helper: map strict text flag → boolean | NULL.
-- lower(trim(x)) ∈ {yes,y,true,t,pass} → TRUE
-- lower(trim(x)) ∈ {no,n,false,f,fail} → FALSE
-- NULL / empty       → NULL (no notice)
-- anything else      → NULL (caller should log to migration_notices)
CREATE OR REPLACE FUNCTION _mig_text_to_bool(txt text)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE lower(trim(coalesce(txt, '')))
    WHEN ''      THEN NULL
    WHEN 'yes'   THEN TRUE
    WHEN 'y'     THEN TRUE
    WHEN 'true'  THEN TRUE
    WHEN 't'     THEN TRUE
    WHEN 'pass'  THEN TRUE
    WHEN 'no'    THEN FALSE
    WHEN 'n'     THEN FALSE
    WHEN 'false' THEN FALSE
    WHEN 'f'     THEN FALSE
    WHEN 'fail'  THEN FALSE
    ELSE NULL
  END
$$;

CREATE OR REPLACE FUNCTION _mig_is_mapped_bool(txt text)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT coalesce(txt, '') = ''
      OR lower(trim(txt)) IN ('yes','y','true','t','pass','no','n','false','f','fail')
$$;

CREATE OR REPLACE FUNCTION _mig_text_to_l1_result(txt text)
RETURNS l1_result LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE lower(trim(coalesce(txt, '')))
    WHEN 'pass'          THEN 'pass'::l1_result
    WHEN 'fail'          THEN 'fail'::l1_result
    WHEN 'inconclusive'  THEN 'inconclusive'::l1_result
    ELSE NULL
  END
$$;

-- Log any flag value that won't map cleanly (so humans can review).
INSERT INTO migration_notices (migration, table_name, row_id, column_name, original_value, reason)
SELECT '20260423000000_normalize', 'companies', id, col, val, 'flag value outside strict yes/pass/no/fail mapping; coerced to NULL'
FROM (
  SELECT id, 'l1_vision_fit' AS col, l1_vision_fit AS val FROM companies WHERE NOT _mig_is_mapped_bool(l1_vision_fit)
  UNION ALL
  SELECT id, 'l1_priority_geo_flag', l1_priority_geo_flag FROM companies WHERE NOT _mig_is_mapped_bool(l1_priority_geo_flag)
  UNION ALL
  SELECT id, 'l1_ev_below_threshold', l1_ev_below_threshold FROM companies WHERE NOT _mig_is_mapped_bool(l1_ev_below_threshold)
  UNION ALL
  SELECT id, 'l1_revenue_no_consecutive_drop_usd', l1_revenue_no_consecutive_drop_usd FROM companies WHERE NOT _mig_is_mapped_bool(l1_revenue_no_consecutive_drop_usd)
  UNION ALL
  SELECT id, 'fx_revenue_no_consecutive_drop_local', fx_revenue_no_consecutive_drop_local FROM companies WHERE NOT _mig_is_mapped_bool(fx_revenue_no_consecutive_drop_local)
  UNION ALL
  SELECT id, 'fx_ebitda_above_10_l3y', fx_ebitda_above_10_l3y FROM companies WHERE NOT _mig_is_mapped_bool(fx_ebitda_above_10_l3y)
  UNION ALL
  SELECT id, 'revenue_from_priority_geo_flag', revenue_from_priority_geo_flag FROM companies WHERE NOT _mig_is_mapped_bool(revenue_from_priority_geo_flag)
  UNION ALL
  SELECT id, 'l1_screening_result', l1_screening_result FROM companies
    WHERE l1_screening_result IS NOT NULL
      AND lower(trim(l1_screening_result)) NOT IN ('', 'pass', 'fail', 'inconclusive')
) flagged;

-- Seed one row per company that has any derived-screening signal. Using
-- generous OR filter so we don't lose partial data.
INSERT INTO company_screening_derived (
  company_id,
  segment_revenue, segment_ebitda, segment_revenue_total_ratio,
  l0_ebitda_2024_usd_mn, l0_ev_2024_usd_mn, l0_revenue_2024_usd_mn, l0_ev_ebitda_2024,
  segment_specific_revenue_pct, combined_segment_revenue, pct_from_domestic, l0_ev_usd_mn,
  revenue_from_priority_geo,
  l1_revenue_cagr_l3y, l1_revenue_drop_count, l1_ebitda_below_threshold_count, l1_revenue_cagr_n3y,
  l1_vision_fit, l1_priority_geo, l1_ev_below_threshold, l1_revenue_no_consecutive_drop,
  l1_rationale, l1_screening_result,
  fx_currency, fx_revenue_drop_count, fx_revenue_no_consecutive_drop, fx_ebitda_above_10_l3y, fx_rationale
)
SELECT
  id,
  segment_revenue, segment_ebitda, segment_revenue_total_ratio,
  l0_ebitda_2024_usd_mn, l0_ev_2024_usd_mn, l0_revenue_2024_usd_mn, l0_ev_ebitda_2024,
  segment_specific_revenue_pct, combined_segment_revenue, pct_from_domestic, l0_ev_usd_mn,
  _mig_text_to_bool(revenue_from_priority_geo_flag),
  l1_revenue_cagr_l3y, l1_revenue_drop_count, l1_ebitda_below_threshold_count, l1_revenue_cagr_n3y,
  _mig_text_to_bool(l1_vision_fit), _mig_text_to_bool(l1_priority_geo_flag),
  _mig_text_to_bool(l1_ev_below_threshold), _mig_text_to_bool(l1_revenue_no_consecutive_drop_usd),
  l1_rationale, _mig_text_to_l1_result(l1_screening_result),
  fx_currency, fx_revenue_drop_count,
  _mig_text_to_bool(fx_revenue_no_consecutive_drop_local), _mig_text_to_bool(fx_ebitda_above_10_l3y),
  fx_rationale
FROM companies
WHERE
     segment_revenue IS NOT NULL OR segment_ebitda IS NOT NULL OR segment_revenue_total_ratio IS NOT NULL
  OR l0_ebitda_2024_usd_mn IS NOT NULL OR l0_ev_2024_usd_mn IS NOT NULL OR l0_revenue_2024_usd_mn IS NOT NULL
  OR l0_ev_ebitda_2024 IS NOT NULL OR segment_specific_revenue_pct IS NOT NULL
  OR combined_segment_revenue IS NOT NULL OR pct_from_domestic IS NOT NULL OR l0_ev_usd_mn IS NOT NULL
  OR revenue_from_priority_geo_flag IS NOT NULL
  OR l1_revenue_cagr_l3y IS NOT NULL OR l1_revenue_drop_count IS NOT NULL
  OR l1_ebitda_below_threshold_count IS NOT NULL OR l1_revenue_cagr_n3y IS NOT NULL
  OR l1_vision_fit IS NOT NULL OR l1_priority_geo_flag IS NOT NULL OR l1_ev_below_threshold IS NOT NULL
  OR l1_rationale IS NOT NULL OR l1_revenue_no_consecutive_drop_usd IS NOT NULL
  OR l1_screening_result IS NOT NULL
  OR fx_currency IS NOT NULL OR fx_revenue_drop_count IS NOT NULL
  OR fx_revenue_no_consecutive_drop_local IS NOT NULL OR fx_rationale IS NOT NULL
  OR fx_ebitda_above_10_l3y IS NOT NULL
ON CONFLICT (company_id) DO NOTHING;

-- Drop helpers — used once, no need to keep them around.
DROP FUNCTION IF EXISTS _mig_text_to_bool(text);
DROP FUNCTION IF EXISTS _mig_is_mapped_bool(text);
DROP FUNCTION IF EXISTS _mig_text_to_l1_result(text);

-- ----------------------------------------------------------------------------
-- 7. Backfill: user_company_favorites from users.favorite_companies jsonb array
--     Orphan UUIDs (no matching company) are dropped via the JOIN.
-- ----------------------------------------------------------------------------

INSERT INTO user_company_favorites (user_id, company_id)
SELECT u.id, c.id
FROM users u
CROSS JOIN LATERAL jsonb_array_elements_text(
  CASE WHEN jsonb_typeof(u.favorite_companies) = 'array'
       THEN u.favorite_companies
       ELSE '[]'::jsonb END
) AS fav(value)
JOIN companies c ON c.id::text = fav.value
ON CONFLICT (user_id, company_id) DO NOTHING;

-- Log any favorite UUID that didn't match a company (helpful for audit).
INSERT INTO migration_notices (migration, table_name, row_id, column_name, original_value, reason)
SELECT '20260423000000_normalize', 'users', u.id, 'favorite_companies', fav.value,
       'favorite UUID did not match any company; dropped from user_company_favorites'
FROM users u
CROSS JOIN LATERAL jsonb_array_elements_text(
  CASE WHEN jsonb_typeof(u.favorite_companies) = 'array'
       THEN u.favorite_companies
       ELSE '[]'::jsonb END
) AS fav(value)
LEFT JOIN companies c ON c.id::text = fav.value
WHERE c.id IS NULL;

-- ----------------------------------------------------------------------------
-- 8. Enum casts on companies (pipeline_stage / status / source)
--     Pre-clean: NULL pipeline_stage → 'L0' so we can SET NOT NULL.
--     Unknown values coerced to sane defaults / NULL; log coercions.
-- ----------------------------------------------------------------------------

-- Log coercions before they happen (defensive — ALTER USING also applies below).
INSERT INTO migration_notices (migration, table_name, row_id, column_name, original_value, reason)
SELECT '20260423000000_normalize', 'companies', id, 'pipeline_stage', pipeline_stage,
       'value outside pipeline_stage enum; coerced to L0'
FROM companies
WHERE pipeline_stage IS NOT NULL
  AND pipeline_stage NOT IN ('market_screening','L0','L1','L2','L3','L4','L5');

INSERT INTO migration_notices (migration, table_name, row_id, column_name, original_value, reason)
SELECT '20260423000000_normalize', 'companies', id, 'source', source,
       'value outside deal_origin enum; coerced to NULL'
FROM companies
WHERE source IS NOT NULL AND source NOT IN ('inbound','outbound');

INSERT INTO migration_notices (migration, table_name, row_id, column_name, original_value, reason)
SELECT '20260423000000_normalize', 'companies', id, 'status', status,
       'value outside company_status enum; coerced to NULL'
FROM companies
WHERE status IS NOT NULL AND status NOT IN ('active','dropped');

-- Normalize nulls before the NOT NULL cast.
UPDATE companies SET pipeline_stage = 'L0' WHERE pipeline_stage IS NULL;

-- Drop the existing CHECK constraint (will be superseded by enum type).
ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_status_check;

-- Cast the three columns.
ALTER TABLE companies
  ALTER COLUMN pipeline_stage DROP DEFAULT,
  ALTER COLUMN pipeline_stage TYPE pipeline_stage USING (
    CASE WHEN pipeline_stage IN ('market_screening','L0','L1','L2','L3','L4','L5')
         THEN pipeline_stage::pipeline_stage
         ELSE 'L0'::pipeline_stage END
  ),
  ALTER COLUMN pipeline_stage SET DEFAULT 'L0'::pipeline_stage,
  ALTER COLUMN pipeline_stage SET NOT NULL;

ALTER TABLE companies
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE company_status USING (
    CASE WHEN status::text IN ('active','dropped')
         THEN status::text::company_status
         ELSE NULL END
  );

ALTER TABLE companies
  ALTER COLUMN source TYPE deal_origin USING (
    CASE WHEN source IN ('inbound','outbound')
         THEN source::deal_origin
         ELSE NULL END
  );

-- ----------------------------------------------------------------------------
-- 9. Enum cast: company_analyses.status
-- ----------------------------------------------------------------------------

INSERT INTO migration_notices (migration, table_name, row_id, column_name, original_value, reason)
SELECT '20260423000000_normalize', 'company_analyses', id, 'status', status,
       'value outside analysis_job_status enum; coerced to pending'
FROM company_analyses
WHERE status NOT IN ('pending','processing','completed','failed');

ALTER TABLE company_analyses
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE analysis_job_status USING (
    CASE WHEN status IN ('pending','processing','completed','failed')
         THEN status::analysis_job_status
         ELSE 'pending'::analysis_job_status END
  ),
  ALTER COLUMN status SET DEFAULT 'pending'::analysis_job_status,
  ALTER COLUMN status SET NOT NULL;

-- ----------------------------------------------------------------------------
-- 10. deal_stage_history.duration_seconds → GENERATED ALWAYS AS ... STORED
-- ----------------------------------------------------------------------------

ALTER TABLE deal_stage_history DROP COLUMN duration_seconds;
ALTER TABLE deal_stage_history ADD COLUMN duration_seconds integer
  GENERATED ALWAYS AS (
    CASE WHEN exited_at IS NOT NULL
         THEN EXTRACT(EPOCH FROM (exited_at - entered_at))::integer
    END
  ) STORED;

-- ----------------------------------------------------------------------------
-- 11. Drops — only after all backfills succeeded
-- ----------------------------------------------------------------------------

ALTER TABLE users DROP COLUMN favorite_companies;

ALTER TABLE companies
  DROP COLUMN revenue_2021_usd_mn,
  DROP COLUMN revenue_2022_usd_mn,
  DROP COLUMN revenue_2023_usd_mn,
  DROP COLUMN revenue_2024_usd_mn,
  DROP COLUMN ebitda_2021_usd_mn,
  DROP COLUMN ebitda_2022_usd_mn,
  DROP COLUMN ebitda_2023_usd_mn,
  DROP COLUMN ebitda_2024_usd_mn,
  DROP COLUMN ev_2024,
  DROP COLUMN ev_ebitda_2024,
  DROP COLUMN ebitda_margin_2021,
  DROP COLUMN ebitda_margin_2022,
  DROP COLUMN ebitda_margin_2023,
  DROP COLUMN ebitda_margin_2024,
  DROP COLUMN revenue_cagr_2021_2022,
  DROP COLUMN revenue_cagr_2022_2023,
  DROP COLUMN revenue_cagr_2023_2024,
  DROP COLUMN fx_revenue_2021,
  DROP COLUMN fx_revenue_2022,
  DROP COLUMN fx_revenue_2023,
  DROP COLUMN fx_revenue_2024,
  DROP COLUMN fx_assumed_forex_2021,
  DROP COLUMN fx_assumed_forex_2022,
  DROP COLUMN fx_assumed_forex_2023,
  DROP COLUMN fx_assumed_forex_2024,
  DROP COLUMN fx_forex_change_2021_2022,
  DROP COLUMN fx_forex_change_2022_2023,
  DROP COLUMN fx_forex_change_2023_2024,
  DROP COLUMN fx_revenue_cagr_domestic_2021_2022,
  DROP COLUMN fx_revenue_cagr_domestic_2022_2023,
  DROP COLUMN fx_revenue_cagr_domestic_2023_2024,
  DROP COLUMN fx_currency,
  DROP COLUMN fx_revenue_drop_count,
  DROP COLUMN fx_revenue_no_consecutive_drop_local,
  DROP COLUMN fx_rationale,
  DROP COLUMN fx_ebitda_above_10_l3y,
  DROP COLUMN l0_ebitda_2024_usd_mn,
  DROP COLUMN l0_ev_2024_usd_mn,
  DROP COLUMN l0_revenue_2024_usd_mn,
  DROP COLUMN l0_ev_ebitda_2024,
  DROP COLUMN l0_ev_usd_mn,
  DROP COLUMN segment_revenue,
  DROP COLUMN segment_ebitda,
  DROP COLUMN segment_revenue_total_ratio,
  DROP COLUMN segment_specific_revenue_pct,
  DROP COLUMN combined_segment_revenue,
  DROP COLUMN pct_from_domestic,
  DROP COLUMN revenue_from_priority_geo_flag,
  DROP COLUMN l1_revenue_cagr_l3y,
  DROP COLUMN l1_revenue_drop_count,
  DROP COLUMN l1_ebitda_below_threshold_count,
  DROP COLUMN l1_revenue_cagr_n3y,
  DROP COLUMN l1_vision_fit,
  DROP COLUMN l1_priority_geo_flag,
  DROP COLUMN l1_ev_below_threshold,
  DROP COLUMN l1_rationale,
  DROP COLUMN l1_revenue_no_consecutive_drop_usd,
  DROP COLUMN l1_screening_result;
