export const REDACTED_FIELD_MESSAGE = '[REDACTED]';

export enum HeaderKey {
  AUTHORIZATION = 'Authorization',
  COOKIE = 'Cookie',
  X_REQUEST_ID = 'x-request-id',
}

export enum RedactedHeaderKey {
  AUTHORIZATION = 'authorization',
  COOKIE = 'cookie',
}

export enum DebugHeaderKey {
  X_REQUEST_ID = 'x-request-id',
}
