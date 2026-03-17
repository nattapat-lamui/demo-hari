/**
 * Custom error class for business logic errors that are safe to show to clients.
 * Use this in services for validation errors, ownership checks, etc.
 */
export class BusinessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BusinessError';
  }
}

/**
 * Extract a safe error message for API responses.
 * Returns the error message if it's a BusinessError (intentional validation),
 * otherwise returns the generic fallback to avoid leaking internals.
 */
export function safeErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof BusinessError) {
    return error.message;
  }
  return fallback;
}
