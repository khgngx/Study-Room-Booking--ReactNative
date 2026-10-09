import { useEffect, useState } from 'react';

import { useAccountStore } from '../store/useAccountStore';
import { useBookingStore } from '../store/useBookingStore';
import { usePolicyStore } from '../store/usePolicyStore';
import { useRoomStore } from '../store/useRoomStore';

const stores = [useAccountStore, useBookingStore, usePolicyStore, useRoomStore];
const allHydrated = () => stores.every((store) => store.persist.hasHydrated());

/** True once every persisted store has loaded from AsyncStorage. */
export function useStoresHydrated(): boolean {
  const [hydrated, setHydrated] = useState(allHydrated);
  useEffect(() => {
    const unsubscribers = stores.map((store) => store.persist.onFinishHydration(() => setHydrated(allHydrated())));
    setHydrated(allHydrated());
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, []);
  return hydrated;
}
