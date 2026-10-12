import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { DEFAULT_POLICY } from '../data/seed';
import type { Policy } from '../domain/types';
import { jsonStorage } from './storage';

interface PolicyState {
  policy: Policy;
  updatePolicy: (changes: Partial<Policy>) => void;
}

const LEGACY_DAILY_LIMIT = 2;

export const usePolicyStore = create<PolicyState>()(
  persist(
    (set) => ({
      policy: DEFAULT_POLICY,
      updatePolicy: (changes) => set((state) => ({ policy: { ...state.policy, ...changes } })),
    }),
    {
      name: 'vku-policy',
      storage: jsonStorage,
      version: 1,
      // Version 0 shipped a default of 2 bookings a day; students may now hold up to 4.
      migrate: (persisted) => {
        const state = persisted as Pick<PolicyState, 'policy'>;
        if (state.policy.maxBookingsPerDay !== LEGACY_DAILY_LIMIT) return state;
        return { policy: { ...state.policy, maxBookingsPerDay: DEFAULT_POLICY.maxBookingsPerDay } };
      },
    },
  ),
);
