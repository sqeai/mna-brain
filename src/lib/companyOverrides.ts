// Hardcoded per-company UI overrides applied in the company card and any
// list/table rendering of a company. Numeric values are USD millions.
//
// Semantics: a defined field on the override takes precedence over the
// database value. An undefined field means "use the value from the system"
// (the spreadsheet's "As-is in system" / blank cells).
export interface CompanyOverride {
  pic?: string;
  revenue_2023_usd_mn?: number;
  revenue_2024_usd_mn?: number;
  revenue_2025_usd_mn?: number;
  ebitda_2023_usd_mn?: number;
  ebitda_2024_usd_mn?: number;
  ebitda_2025_usd_mn?: number;
  ev_2024?: number;
}

export const COMPANY_OVERRIDES: Record<string, CompanyOverride> = {
  // Project Bold
  '02362b61-69d3-49d2-9d76-8cc8216c65ca': { pic: 'Jien Lit' },
  // Lian Shi New Materials
  'f1234f36-58f5-4566-901b-c07570d571fe': {
    pic: 'CP Tei',
    revenue_2023_usd_mn: 57.1,
    revenue_2024_usd_mn: 72.9,
    revenue_2025_usd_mn: 88.6,
    ebitda_2023_usd_mn: -5.4,
    ebitda_2024_usd_mn: -4.3,
    ebitda_2025_usd_mn: -0.7,
    ev_2024: 185.7,
  },
  // Creditchem
  'bae3628a-593a-4e03-b510-3566cca405b4': {
    pic: 'CP Tei',
    revenue_2023_usd_mn: 65.1,
    ev_2024: 285.7,
  },
  // Jili New Materials
  'b64a9843-43ee-46fa-84d7-659b6f8d76c5': {
    pic: 'CP Tei',
    revenue_2024_usd_mn: 98.6,
    revenue_2025_usd_mn: 100.0,
    ebitda_2024_usd_mn: 8.7,
    ebitda_2025_usd_mn: 10.0,
    ev_2024: 107.1,
  },
  // Project Zenith
  'b88477d2-2c6c-4883-9c8a-3ce990a1bf39': { pic: 'Hendric' },
  // Yesiang
  '772241d6-9d21-483b-b9d4-a91f22b7e84e': { pic: 'Jien Lit' },
  // Meridian Adhesives Group
  'b6d9b6d5-b4f4-4cf5-9374-190faeece69f': { pic: 'Dessi' },
  // Hanul Co., Ltd.
  'd937fa83-b188-4c42-9773-6b9b2ceabf34': { pic: 'Hendric' },
  // Shin Micro
  'a7e51a78-bbff-4065-b81c-2eb631bfc5ac': {
    pic: 'CP Tei',
    revenue_2023_usd_mn: 5.3,
    revenue_2024_usd_mn: 8.1,
    revenue_2025_usd_mn: 10.0,
    ebitda_2023_usd_mn: -5.4,
    ebitda_2024_usd_mn: -3.0,
    ebitda_2025_usd_mn: -1.3,
    ev_2024: 128.6,
  },
  // Advantek Inc
  '5ecfc973-f3b1-4220-be05-8cc7ec2aeee3': { pic: 'Jien Lit' },
  // Chemleader Corporation (CLC)
  '6a34801d-acb3-4709-a16a-2662bb714dab': { pic: 'Hendric' },
  // LCY Chemical (Revenue 2023 = TBC, treated as no override)
  '3641b749-03c4-4a8a-83b8-ae76e3077d87': { pic: 'Hendric', ebitda_2025_usd_mn: 70.0 },
  // CoreDux
  'ce461dad-5be6-4144-8374-1b08fafdf776': { pic: 'Jien Lit' },
  // Fluoro Tech Co., Ltd
  'e2346c8a-f8bd-4015-b18a-b7e4ff11f4bc': { pic: 'Hendric' },
  // Project Freya
  'f695f6b7-35a4-491e-8a53-26888496bbdb': { pic: 'Hendric' },
  // JNF Co Ltd.
  'a0a8c8c1-980f-4643-b3d0-57de2e12888a': { pic: 'Samuel Nathaniel' },
  // Gchem
  '21b787d5-e90f-4511-b43b-5030467196a0': { pic: 'Dessi' },
};

export function getCompanyOverride(id: string | null | undefined): CompanyOverride | undefined {
  if (!id) return undefined;
  return COMPANY_OVERRIDES[id];
}

/**
 * Merge per-year override values (revenue/ebitda for 2023/2024/2025) into the
 * normalized `company_financials` rows. If a year has no DB row, a synthetic
 * row is created from the override. Used by the FinancialCharts call sites so
 * companies with only override data still render bars.
 */
export function mergeFinancialsWithOverrides<
  T extends { fiscal_year: number; revenue_usd_mn: number | null; ebitda_usd_mn: number | null },
>(companyId: string, base: T[]): Array<{ fiscal_year: number; revenue_usd_mn: number | null; ebitda_usd_mn: number | null }> {
  const override = getCompanyOverride(companyId);
  const byYear = new Map<number, { fiscal_year: number; revenue_usd_mn: number | null; ebitda_usd_mn: number | null }>();
  for (const row of base) {
    byYear.set(row.fiscal_year, {
      fiscal_year: row.fiscal_year,
      revenue_usd_mn: row.revenue_usd_mn,
      ebitda_usd_mn: row.ebitda_usd_mn,
    });
  }
  if (!override) return Array.from(byYear.values()).sort((a, b) => a.fiscal_year - b.fiscal_year);

  const overrideMap: Array<[number, keyof CompanyOverride, keyof CompanyOverride]> = [
    [2023, 'revenue_2023_usd_mn', 'ebitda_2023_usd_mn'],
    [2024, 'revenue_2024_usd_mn', 'ebitda_2024_usd_mn'],
    [2025, 'revenue_2025_usd_mn', 'ebitda_2025_usd_mn'],
  ];
  for (const [year, revKey, ebtKey] of overrideMap) {
    const existing = byYear.get(year) ?? { fiscal_year: year, revenue_usd_mn: null, ebitda_usd_mn: null };
    const rev = override[revKey];
    const ebt = override[ebtKey];
    if (typeof rev === 'number') existing.revenue_usd_mn = rev;
    if (typeof ebt === 'number') existing.ebitda_usd_mn = ebt;
    if (typeof rev === 'number' || typeof ebt === 'number' || byYear.has(year)) {
      byYear.set(year, existing);
    }
  }
  return Array.from(byYear.values()).sort((a, b) => a.fiscal_year - b.fiscal_year);
}
