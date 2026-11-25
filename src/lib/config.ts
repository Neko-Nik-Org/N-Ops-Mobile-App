/** Build-time settings. Edit here (no .env tooling in this bare project). */
export const config = {
  /** Server used for typed codes when none is given (e.g. managed cloud). Empty = require one. */
  defaultServer: 'https://main-api.test.nops.app',
  requestTimeoutMs: 15000,
} as const;
