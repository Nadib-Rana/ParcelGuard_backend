import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { PaginationQueryDto } from "../dto/pagination-query.dto";

export const PaginationParams = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): PaginationQueryDto => {
    const req = ctx.switchToHttp().getRequest();
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const search = req.query.search;
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? "asc" : "desc";

    return {
      page: page > 0 ? page : 1,
      limit: limit > 0 && limit <= 100 ? limit : 10,
      search,
      sortBy,
      sortOrder,
    };
  },
);
