import { useEffect, useState } from 'react';
import { countPendingOutbox } from '../lib/localDb';
import { subscribeOfflineDataChanged } from '../lib/data/offlineEvents';

export function usePendingOutboxCount(): number {
  const [n, setN] = useState(0);
  useEffect(() => {
    const refresh = () => {
      void countPendingOutbox().then(setN);
    };
    refresh();
    return subscribeOfflineDataChanged(refresh);
  }, []);
  return n;
}
