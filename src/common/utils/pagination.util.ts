import { PaginationQueryDto } from "../dto/pagination-query.dto";
import { PaginatedResponseDto } from "../dto/api-response.dto";

export interface PaginationOptions {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export class PaginationUtil {
  static getSkipTake(query?: PaginationQueryDto) {
    const page = query?.page && query.page > 0 ? query.page : 1;
    const limit =
      query?.limit && query.limit > 0 && query.limit <= 100 ? query.limit : 10;
    const skip = (page - 1) * limit;

    return {
      skip,
      take: limit,
      page,
      limit,
    };
  }

  static paginate<T>(
    items: T[],
    total: number,
    page: number,
    limit: number,
  ): PaginatedResponseDto<T> {
    return new PaginatedResponseDto<T>(items, total, page, limit);
  }
}
