import type { paths } from './generated/schema';

export type LoginResponse =
  paths['/auth/login']['post']['responses']['200']['content']['*/*'];
