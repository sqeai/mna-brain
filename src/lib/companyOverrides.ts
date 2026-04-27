// Hardcoded per-company UI overrides. Applied in the company card and any
// list/table rendering of a company. Values for revenue/ebitda are USD millions.
//
// Source mapping note: the source spreadsheet labels the columns
// "revenue 2025" and "ebitda 2026". They are surfaced in the existing
// "Revenue 2025" / "EBITDA 2025" UI cells, which are otherwise unpopulated.
export interface CompanyOverride {
  pic?: string;
  revenue_2025_usd_mn?: number;
  ebitda_2025_usd_mn?: number;
}

export const COMPANY_OVERRIDES: Record<string, CompanyOverride> = {
  '02362b61-69d3-49d2-9d76-8cc8216c65ca': { pic: 'Jien Lit' },
  'f1234f36-58f5-4566-901b-c07570d571fe': { pic: 'CP Tei', revenue_2025_usd_mn: 88.6, ebitda_2025_usd_mn: -0.7 },
  'bae3628a-593a-4e03-b510-3566cca405b4': { pic: 'CP Tei' },
  'b64a9843-43ee-46fa-84d7-659b6f8d76c5': { pic: 'CP Tei', revenue_2025_usd_mn: 100, ebitda_2025_usd_mn: 10 },
  '5ecfc973-f3b1-4220-be05-8cc7ec2aeee3': { pic: 'Jien Lit' },
  '6a34801d-acb3-4709-a16a-2662bb714dab': { pic: 'Hendric' },
  '772241d6-9d21-483b-b9d4-a91f22b7e84e': { pic: 'Jien Lit' },
  'ce461dad-5be6-4144-8374-1b08fafdf776': { pic: 'Jien Lit' },
  'a0a8c8c1-980f-4643-b3d0-57de2e12888a': { pic: 'Hendric' },
  'a7e51a78-bbff-4065-b81c-2eb631bfc5ac': { pic: 'CP Tei', revenue_2025_usd_mn: 10, ebitda_2025_usd_mn: -1.3 },
};

export function getCompanyOverride(id: string | null | undefined): CompanyOverride | undefined {
  if (!id) return undefined;
  return COMPANY_OVERRIDES[id];
}
