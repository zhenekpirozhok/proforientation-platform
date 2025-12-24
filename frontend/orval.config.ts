import { defineConfig } from 'orval';

export default defineConfig({
  api: {
    input: '../documentation/api-docs/reference/openapi.yaml',
    output: {
      target: 'src/shared/api/generated/api.ts',
      schemas: 'src/shared/api/generated/model',
      client: 'react-query',
      httpClient: 'fetch',
      clean: true,
      override: {
        fetch: {
          includeHttpResponseReturnType: false,
        },
        query: {
          useQuery: true,
          useMutation: true,
        },
        mutator: {
          path: 'src/shared/api/orvalFetch.ts',
          name: 'orvalFetch',
        },
      },
    },
  },
});
