export class ErrorDetail {
  code?: string;
  message?: string;
  field?: string;
  meta?: any;
  errors?: string[];
  [key: string]: any;
}

export class ApiErrorResponseDto {
  readonly success: boolean = false;
  readonly statusCode: number;
  readonly message: string;
  readonly errorCode?: string;
  readonly requestId: string | null;
  readonly timestamp: string;
  readonly path: string;
  readonly errors: ErrorDetail[];
  readonly instruction?: string;
  readonly details?: unknown;
  readonly stack?: string;
  readonly isVerified?: boolean;

  constructor(
    statusCode: number,
    message: string,
    errors: ErrorDetail[] = [],
    path: string = "",
    requestId: string | null = null,
    instruction?: string,
    details?: unknown,
    stack?: string,
    isVerified?: boolean,
  ) {
    this.statusCode = statusCode;
    this.message = message;
    this.errors = errors;
    this.path = path;
    this.requestId = requestId;
    this.timestamp = new Date().toISOString();
    this.instruction = instruction;
    this.details = details;
    this.stack = stack;
    this.isVerified = isVerified;
  }
}
