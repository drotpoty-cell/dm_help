import { useState, useEffect } from 'react';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';

export function useStoreHydration() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Ждем, пока Zustand подтянет данные из localStorage на клиенте
    const unsub = useWorkspaceStore.persist.onHydrate(() => setHydrated(false));
    const unsubFinish = useWorkspaceStore.persist.onFinishHydration(() => setHydrated(true));

    // Если стор уже гидрирован
    if (useWorkspaceStore.persist.hasHydrated()) {
      setHydrated(true);
    }

    return () => {
      unsub();
      unsubFinish();
    };
  }, []);

  return hydrated;
}
