import { HttpStatus } from "@nestjs/common";
import { BaseException } from "./base.exception";
import { ErrorDetail } from "../dto/api-error-response.dto";

export class BadRequestException extends BaseException {
  constructor(
    message: string = "Bad request",
    code: string = "BAD_REQUEST",
    errors?: ErrorDetail[],
    instruction?: string,
    details?: unknown,
  ) {
    super(message, HttpStatus.BAD_REQUEST, code, errors, instruction, details);
  }
}

export class UnauthorizedException extends BaseException {
  constructor(
    message: string = "Authentication required",
    isVerified?: boolean,
    code: string = "AUTHENTICATION_ERROR",
    errors?: ErrorDetail[],
    instruction?: string,
    details?: unknown,
  ) {
    super(
      message,
      HttpStatus.UNAUTHORIZED,
      code,
      errors,
      instruction,
      details,
      isVerified,
    );
  }
}

export class ForbiddenException extends BaseException {
  constructor(
    message: string = "Access denied",
    code: string = "FORBIDDEN_ACCESS",
    errors?: ErrorDetail[],
    instruction?: string,
    details?: unknown,
  ) {
    super(message, HttpStatus.FORBIDDEN, code, errors, instruction, details);
  }
}

export class NotFoundException extends BaseException {
  constructor(
    message: string = "Resource not found",
    code: string = "RESOURCE_NOT_FOUND",
    errors?: ErrorDetail[],
    instruction?: string,
    details?: unknown,
  ) {
    super(message, HttpStatus.NOT_FOUND, code, errors, instruction, details);
  }
}

export class ConflictException extends BaseException {
  constructor(
    message: string = "Resource already exists",
    code: string = "RESOURCE_CONFLICT",
    errors?: ErrorDetail[],
    instruction?: string,
    details?: unknown,
  ) {
    super(message, HttpStatus.CONFLICT, code, errors, instruction, details);
  }
}

export class InternalServerErrorException extends BaseException {
  constructor(
    message: string = "Internal server error",
    code: string = "INTERNAL_SERVER_ERROR",
    errors?: ErrorDetail[],
    instruction?: string,
    details?: unknown,
  ) {
    super(
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
      code,
      errors,
      instruction,
      details,
    );
  }
}
