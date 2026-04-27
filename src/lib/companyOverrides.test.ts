import { describe, expect, it } from 'vitest';
import { COMPANY_OVERRIDES, getCompanyOverride } from './companyOverrides';

describe('getCompanyOverride', () => {
  it('returns the full override for Lian Shi New Materials', () => {
    expect(getCompanyOverride('f1234f36-58f5-4566-901b-c07570d571fe')).toEqual({
      pic: 'CP Tei',
      revenue_2023_usd_mn: 57.1,
      revenue_2024_usd_mn: 72.9,
      revenue_2025_usd_mn: 88.6,
      ebitda_2023_usd_mn: -5.4,
      ebitda_2024_usd_mn: -4.3,
      ebitda_2025_usd_mn: -0.7,
      ev_2024: 185.7,
    });
  });

  it('returns the full override for Shin Micro', () => {
    expect(getCompanyOverride('a7e51a78-bbff-4065-b81c-2eb631bfc5ac')).toEqual({
      pic: 'CP Tei',
      revenue_2023_usd_mn: 5.3,
      revenue_2024_usd_mn: 8.1,
      revenue_2025_usd_mn: 10.0,
      ebitda_2023_usd_mn: -5.4,
      ebitda_2024_usd_mn: -3.0,
      ebitda_2025_usd_mn: -1.3,
      ev_2024: 128.6,
    });
  });

  it('returns a partial override for Creditchem (rev 2023 + EV only)', () => {
    expect(getCompanyOverride('bae3628a-593a-4e03-b510-3566cca405b4')).toEqual({
      pic: 'CP Tei',
      revenue_2023_usd_mn: 65.1,
      ev_2024: 285.7,
    });
  });

  it('returns a partial override for Jili New Materials (no rev/ebitda 2023)', () => {
    const override = getCompanyOverride('b64a9843-43ee-46fa-84d7-659b6f8d76c5');
    expect(override).toEqual({
      pic: 'CP Tei',
      revenue_2024_usd_mn: 98.6,
      revenue_2025_usd_mn: 100.0,
      ebitda_2024_usd_mn: 8.7,
      ebitda_2025_usd_mn: 10.0,
      ev_2024: 107.1,
    });
    expect(override?.revenue_2023_usd_mn).toBeUndefined();
    expect(override?.ebitda_2023_usd_mn).toBeUndefined();
  });

  it('treats LCY Chemical "TBC" as no revenue override but keeps EBITDA 2025', () => {
    const override = getCompanyOverride('3641b749-03c4-4a8a-83b8-ae76e3077d87');
    expect(override).toEqual({ pic: 'Hendric', ebitda_2025_usd_mn: 70.0 });
    expect(override?.revenue_2023_usd_mn).toBeUndefined();
  });

  it('returns pic-only overrides for "As-is in system" rows', () => {
    expect(getCompanyOverride('02362b61-69d3-49d2-9d76-8cc8216c65ca')).toEqual({ pic: 'Jien Lit' });
    expect(getCompanyOverride('b88477d2-2c6c-4883-9c8a-3ce990a1bf39')).toEqual({ pic: 'Hendric' });
    expect(getCompanyOverride('b6d9b6d5-b4f4-4cf5-9374-190faeece69f')).toEqual({ pic: 'Dessi' });
    expect(getCompanyOverride('a0a8c8c1-980f-4643-b3d0-57de2e12888a')).toEqual({ pic: 'Samuel Nathaniel' });
  });

  it('returns undefined for unknown id', () => {
    expect(getCompanyOverride('00000000-0000-0000-0000-000000000000')).toBeUndefined();
  });

  it('returns undefined for null/undefined/empty id', () => {
    expect(getCompanyOverride(null)).toBeUndefined();
    expect(getCompanyOverride(undefined)).toBeUndefined();
    expect(getCompanyOverride('')).toBeUndefined();
  });

  it('contains seventeen entries with trimmed pic values', () => {
    const ids = Object.keys(COMPANY_OVERRIDES);
    expect(ids).toHaveLength(17);
    for (const id of ids) {
      const o = COMPANY_OVERRIDES[id];
      expect(o.pic).toBeDefined();
      expect(o.pic).toBe(o.pic!.trim());
    }
  });
});
