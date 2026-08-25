import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";
import { Request } from "express";
import { ContextService } from "../context/context.service";
import { ApiErrorResponseDto } from "../dto/api-error-response.dto";
import { BaseException } from "../exceptions/base.exception";

@Catch()
@Injectable()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly contextService: ContextService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Internal server error";
    let errorCode = "INTERNAL_SERVER_ERROR";
    let errors: any[] = [];
    let instruction: string | undefined = undefined;
    let details: unknown = undefined;

    if (exception instanceof BaseException) {
      statusCode = exception.getStatus();
      errorCode = exception.code || "BASE_EXCEPTION";
      instruction = exception.instruction;
      details = exception.details;
      errors = exception.errors || [];
      const res = exception.getResponse() as any;
      message = typeof res === "string" ? res : res.message || message;
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res = exception.getResponse() as any;
      message = typeof res === "string" ? res : res.message || message;
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(`Unhandled exception: ${exception.message}`, exception.stack);
    }

    const responseBody: ApiErrorResponseDto = {
      success: false,
      statusCode,
      message: Array.isArray(message) ? message.join(", ") : message,
      errorCode,
      requestId: this.contextService.getRequestId() || null,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(request),
      errors,
      instruction,
      details,
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, statusCode);
  }
}
