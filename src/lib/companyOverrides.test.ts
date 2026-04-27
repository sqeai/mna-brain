import { describe, expect, it } from 'vitest';
import { COMPANY_OVERRIDES, getCompanyOverride } from './companyOverrides';

describe('getCompanyOverride', () => {
  it('returns the override for a known id', () => {
    const override = getCompanyOverride('f1234f36-58f5-4566-901b-c07570d571fe');
    expect(override).toEqual({
      pic: 'CP Tei',
      revenue_2025_usd_mn: 88.6,
      ebitda_2025_usd_mn: -0.7,
    });
  });

  it('returns an override containing only pic when no financials are provided', () => {
    const override = getCompanyOverride('02362b61-69d3-49d2-9d76-8cc8216c65ca');
    expect(override).toEqual({ pic: 'Jien Lit' });
    expect(override?.revenue_2025_usd_mn).toBeUndefined();
    expect(override?.ebitda_2025_usd_mn).toBeUndefined();
  });

  it('returns undefined for an unknown id', () => {
    expect(getCompanyOverride('00000000-0000-0000-0000-000000000000')).toBeUndefined();
  });

  it('returns undefined when id is null or empty', () => {
    expect(getCompanyOverride(null)).toBeUndefined();
    expect(getCompanyOverride(undefined)).toBeUndefined();
    expect(getCompanyOverride('')).toBeUndefined();
  });

  it('contains all ten configured overrides with trimmed PIC values', () => {
    const ids = Object.keys(COMPANY_OVERRIDES);
    expect(ids).toHaveLength(10);
    for (const id of ids) {
      const o = COMPANY_OVERRIDES[id];
      expect(o.pic).toBeDefined();
      expect(o.pic).toBe(o.pic!.trim());
    }
  });

  it('honors the partial-row overrides verbatim', () => {
    expect(getCompanyOverride('b64a9843-43ee-46fa-84d7-659b6f8d76c5')).toEqual({
      pic: 'CP Tei',
      revenue_2025_usd_mn: 100,
      ebitda_2025_usd_mn: 10,
    });
    expect(getCompanyOverride('a7e51a78-bbff-4065-b81c-2eb631bfc5ac')).toEqual({
      pic: 'CP Tei',
      revenue_2025_usd_mn: 10,
      ebitda_2025_usd_mn: -1.3,
    });
    expect(getCompanyOverride('6a34801d-acb3-4709-a16a-2662bb714dab')).toEqual({ pic: 'Hendric' });
  });
});
