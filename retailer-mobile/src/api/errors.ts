/**
 * One error type for every failed request.
 *
 * The backend uses three body shapes, so all are read here:
 *   { message }         retailer cart/order/OTP routes
 *   { error }           payment, wholesaler, admin, 401/404/500
 *   { code, message }   503 PAYMENT_UNAVAILABLE
 */
export type ApiErrorKind = 'http' | 'network' | 'timeout' | 'invalid_response';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | null;
  readonly code: string | null;

  constructor(options: {
    kind: ApiErrorKind;
    message: string;
    status?: number | null;
    code?: string | null;
  }) {
    super(options.message);
    this.name = 'ApiError';
    this.kind = options.kind;
    this.status = options.status ?? null;
    this.code = options.code ?? null;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}

export const NETWORK_ERROR_MESSAGE =
  "Can't reach SarakuSetu. Check your internet connection and try again.";
export const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.';

export function messageFromBody(body: unknown): { message: string | null; code: string | null } {
  if (typeof body !== 'object' || body === null) {
    return { message: null, code: null };
  }
  const record = body as Record<string, unknown>;
  const message =
    typeof record.message === 'string'
      ? record.message
      : typeof record.error === 'string'
        ? record.error
        : null;
  const code = typeof record.code === 'string' ? record.code : null;
  return { message, code };
}

/** User-facing text for any thrown value. */
export function toUserMessage(error: unknown): string {
  if (isApiError(error)) {
    if (error.kind === 'network' || error.kind === 'timeout') return NETWORK_ERROR_MESSAGE;
    return error.message || GENERIC_ERROR_MESSAGE;
  }
  return GENERIC_ERROR_MESSAGE;
}
