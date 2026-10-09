import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { DEFAULT_POLICY } from '../data/seed';
import type { Policy } from '../domain/types';
import { jsonStorage } from './storage';

interface PolicyState {
  policy: Policy;
  updatePolicy: (changes: Partial<Policy>) => void;
}

export const usePolicyStore = create<PolicyState>()(
  persist(
    (set) => ({
      policy: DEFAULT_POLICY,
      updatePolicy: (changes) => set((state) => ({ policy: { ...state.policy, ...changes } })),
    }),
    { name: 'vku-policy', storage: jsonStorage },
  ),
);
