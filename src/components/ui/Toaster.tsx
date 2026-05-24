'use client'

import { Toaster as SonnerToaster } from 'sonner'

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: 'bg-zinc-950/95 border border-zinc-800 text-zinc-200 shadow-2xl backdrop-blur-md',
          title: 'text-xs font-black uppercase tracking-widest',
          description: 'text-xs text-zinc-400'
        }
      }}
    />
  )
}

