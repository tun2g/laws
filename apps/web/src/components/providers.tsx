'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { ReactNode, useEffect } from 'react';
import { getQueryClient } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth-store';

export function Providers({ children }: { children: ReactNode }) {
  const initialise = useAuth((s) => s.initialise);
  useEffect(() => {
    void initialise();
  }, [initialise]);

  return (
    <QueryClientProvider client={getQueryClient()}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: { borderRadius: '8px', fontSize: '14px' },
        }}
      />
    </QueryClientProvider>
  );
}
