import { BaseError, ErrorMetadata } from './base.error';

export class ApiError extends BaseError {
  constructor(
    message: string,
    statusCode = 500,
    code = 'INTERNAL_ERROR',
    metadata?: ErrorMetadata,
  ) {
    super(message, statusCode, code, true, metadata);
  }

  static badRequest(message: string, code = 'BAD_REQUEST', metadata?: ErrorMetadata): ApiError {
    return new ApiError(message, 400, code, metadata);
  }

  static unauthorized(message = 'Unauthorized', code = 'UNAUTHORIZED', metadata?: ErrorMetadata): ApiError {
    return new ApiError(message, 401, code, metadata);
  }

  static forbidden(message = 'Forbidden', code = 'FORBIDDEN', metadata?: ErrorMetadata): ApiError {
    return new ApiError(message, 403, code, metadata);
  }

  static notFound(resource: string, id?: string): ApiError {
    const message = id ? `${resource} with id '${id}' not found` : `${resource} not found`;
    return new ApiError(message, 404, 'NOT_FOUND', { resource, id });
  }

  static conflict(message: string, code = 'CONFLICT', metadata?: ErrorMetadata): ApiError {
    return new ApiError(message, 409, code, metadata);
  }

  static unprocessable(message: string, errors?: unknown): ApiError {
    return new ApiError(message, 422, 'VALIDATION_ERROR', { errors });
  }

  static tooManyRequests(message = 'Too many requests', retryAfter?: number): ApiError {
    return new ApiError(message, 429, 'RATE_LIMIT_EXCEEDED', { retryAfter });
  }

  static internal(message = 'Internal server error', code = 'INTERNAL_ERROR'): ApiError {
    return new ApiError(message, 500, code, undefined);
  }

  static serviceUnavailable(message = 'Service temporarily unavailable'): ApiError {
    return new ApiError(message, 503, 'SERVICE_UNAVAILABLE');
  }
}
