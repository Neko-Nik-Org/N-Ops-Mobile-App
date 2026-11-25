export type ApiErrorKind = 'invalid_code' | 'expired_code' | 'unauthorized' | 'network' | 'server' | 'no_server';

export class ApiError extends Error {
  constructor(
    public kind: ApiErrorKind,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function messageOf(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  return 'Something went wrong. Try again in a moment.';
}
