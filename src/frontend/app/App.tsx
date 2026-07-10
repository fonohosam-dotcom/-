import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAppStore } from '../stores/useStore';
import { AppRoutes } from '../routes';

const queryClient = new QueryClient();

export default function App() {
  const initTheme = useAppStore(state => state.initTheme);
  
  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return (
    <QueryClientProvider client={queryClient}>
      <AppRoutes />
    </QueryClientProvider>
  );
}
