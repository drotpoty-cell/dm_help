import { useState, useEffect } from 'react';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';

export function useStoreHydration() {
  // Ленивая инициализация: если стор уже гидрирован к моменту первого рендера,
  // мы узнаём об этом сразу, а не синхронным setState внутри эффекта
  // (что раньше вызывало лишний каскадный ре-рендер).
  const [hydrated, setHydrated] = useState(() => typeof window !== 'undefined' ? (useWorkspaceStore.persist?.hasHydrated() ?? true) : true);

  useEffect(() => {
    // Дальше просто подписываемся на будущие изменения статуса гидратации
    const unsub = useWorkspaceStore.persist.onHydrate(() => setHydrated(false));
    const unsubFinish = useWorkspaceStore.persist.onFinishHydration(() => setHydrated(true));

    return () => {
      unsub();
      unsubFinish();
    };
  }, []);

  return hydrated;
}
