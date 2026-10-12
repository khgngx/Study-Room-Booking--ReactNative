import { getPresence } from '../domain/permissions';
import type { Presence } from '../domain/types';
import { useCurrentUser } from '../store/useBookingStore';

export function usePresence(): Presence {
  const user = useCurrentUser();
  return user ? getPresence(user) : 'online';
}

/** False while the signed-in user is "inactive": the app is read-only for them. */
export function useCanAct(): boolean {
  return usePresence() !== 'inactive';
}
