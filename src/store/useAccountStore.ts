import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { SEED_USERS } from '../data/seed';
import type { Building, Presence, User, UserRole } from '../domain/types';
import { createId, jsonStorage } from './storage';

export type RegisterResult = { ok: true; user: User } | { ok: false; reason: 'email_taken' };

interface AccountState {
  users: User[];
  authenticate: (email: string, password: string) => User | null;
  register: (input: { name: string; email: string; password: string; studentId: string }) => RegisterResult;
  updateProfile: (id: string, changes: Pick<User, 'name' | 'studentId'>) => void;
  /** Pass undefined to go back to the initials. */
  setAvatar: (id: string, avatarUrl: string | undefined) => void;
  setPresence: (id: string, presence: Presence) => void;
  setRole: (id: string, role: UserRole) => void;
  setAssignedBuildings: (id: string, buildings: Building[]) => void;
}

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const useAccountStore = create<AccountState>()(
  persist(
    (set, get) => ({
      users: SEED_USERS,
      authenticate: (email, password) =>
        get().users.find((user) => user.email === normalizeEmail(email) && user.password === password) ?? null,
      // Self-registration always creates a student; staff roles are granted by a facility manager.
      register: ({ name, email, password, studentId }) => {
        const normalized = normalizeEmail(email);
        if (get().users.some((user) => user.email === normalized)) return { ok: false, reason: 'email_taken' };
        const user: User = {
          id: createId('user'),
          name: name.trim(),
          email: normalized,
          password,
          role: 'student',
          studentId: studentId.trim() || undefined,
        };
        set((state) => ({ users: [...state.users, user] }));
        return { ok: true, user };
      },
      updateProfile: (id, changes) =>
        set((state) => ({ users: state.users.map((user) => (user.id === id ? { ...user, ...changes } : user)) })),
      setAvatar: (id, avatarUrl) =>
        set((state) => ({ users: state.users.map((user) => (user.id === id ? { ...user, avatarUrl } : user)) })),
      setPresence: (id, presence) =>
        set((state) => ({ users: state.users.map((user) => (user.id === id ? { ...user, presence } : user)) })),
      setRole: (id, role) =>
        set((state) => ({
          users: state.users.map((user) =>
            user.id === id
              ? { ...user, role, assignedBuildings: role === 'lab_staff' ? (user.assignedBuildings ?? []) : undefined }
              : user,
          ),
        })),
      setAssignedBuildings: (id, buildings) =>
        set((state) => ({
          users: state.users.map((user) => (user.id === id ? { ...user, assignedBuildings: buildings } : user)),
        })),
    }),
    { name: 'vku-accounts', storage: jsonStorage },
  ),
);
