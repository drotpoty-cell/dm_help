'use client'

import { useEffect } from 'react';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';

export default function HydrationWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    useWorkspaceStore.persist.rehydrate();
  }, []);

  return <>{children}</>;
}
