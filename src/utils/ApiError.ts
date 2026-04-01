import { ErrorCode } from '../types/enums';

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: unknown;

  constructor(statusCode: number, code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static badRequest(message: string, details?: unknown): ApiError {
    return new ApiError(400, ErrorCode.VALIDATION_ERROR, message, details);
  }

  static notFound(message: string): ApiError {
    return new ApiError(404, ErrorCode.NOT_FOUND, message);
  }

  static rateLimited(): ApiError {
    return new ApiError(429, ErrorCode.RATE_LIMITED, 'Too many requests');
  }

  static s3Error(message: string): ApiError {
    return new ApiError(502, ErrorCode.S3_ERROR, message);
  }

  static internal(message: string = 'Internal server error'): ApiError {
    return new ApiError(500, ErrorCode.INTERNAL_ERROR, message);
  }
}
