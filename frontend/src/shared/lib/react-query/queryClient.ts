import { QueryClient } from '@tanstack/react-query';

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 10 * 60_000,
        gcTime: 60 * 60_000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: false,
      },
    },
  });
}
