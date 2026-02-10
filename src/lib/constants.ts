import type { DealStage } from './types';

export const STAGE_LABELS: Record<DealStage | 'Acquired', string> = {
  market_screening: 'Market Scanning',
  L0: 'Sourcing',
  L1: 'Screening',
  L2: 'Initial Review',
  L3: 'Due Diligence',
  L4: 'Negotiation',
  L5: 'Closing',
  Acquired: 'Acquired',
};
