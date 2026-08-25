import { Injectable, NestMiddleware, Logger } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { requestContext, RequestContextStore } from "../context/storage";
import { REQUEST_ID_KEY } from "../context/context.service";
import { randomUUID } from "crypto";

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  private readonly logger = new Logger("HTTP");

  use(req: Request, res: Response, next: NextFunction) {
    const requestId = (req.headers["x-request-id"] as string) || randomUUID();
    const store: RequestContextStore = new Map();
    store.set(REQUEST_ID_KEY, requestId);
    res.setHeader("x-request-id", requestId);

    const { method, originalUrl } = req;
    const startTime = Date.now();

    res.on("finish", () => {
      const { statusCode } = res;
      const duration = Date.now() - startTime;
      const icon = statusCode >= 400 ? "❌" : "✅";
      this.logger.log(
        `${icon} ${method} ${originalUrl} -> Status ${statusCode} (${duration}ms)`,
      );
    });

    requestContext.run(store, () => {
      next();
    });
  }
}
