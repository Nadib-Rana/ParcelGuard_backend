import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { Request, Response } from "express";
import { ContextService } from "../context/context.service";
import { ApiErrorResponseDto } from "../dto/api-error-response.dto";

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaClientExceptionFilter.name);

  constructor(private readonly contextService: ContextService) {}

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "A database error occurred";
    let errorCode = "DATABASE_ERROR";

    switch (exception.code) {
      case "P2002": {
        statusCode = HttpStatus.CONFLICT;
        const target = (exception.meta?.target as string[]) || ["field"];
        message = `Unique constraint violation: A record with this ${target.join(", ")} already exists.`;
        errorCode = "UNIQUE_CONSTRAINT_VIOLATION";
        break;
      }
      case "P2025": {
        statusCode = HttpStatus.NOT_FOUND;
        message =
          (exception.meta?.cause as string) ||
          "Record to update or delete not found.";
        errorCode = "RECORD_NOT_FOUND";
        break;
      }
      case "P2003": {
        statusCode = HttpStatus.BAD_REQUEST;
        message = "Foreign key constraint failed on the database operation.";
        errorCode = "FOREIGN_KEY_VIOLATION";
        break;
      }
      default: {
        statusCode = HttpStatus.BAD_REQUEST;
        message = exception.message || "Database request failed";
        errorCode = exception.code;
        break;
      }
    }

    this.logger.warn(`Prisma error [${exception.code}]: ${message}`);

    const errorResponse: ApiErrorResponseDto = {
      success: false,
      statusCode,
      message,
      errorCode,
      requestId: this.contextService.getRequestId() || null,
      timestamp: new Date().toISOString(),
      path: request.url,
      errors: [
        {
          code: exception.code,
          meta: exception.meta,
        },
      ],
    };

    response.status(statusCode).json(errorResponse);
  }
}
