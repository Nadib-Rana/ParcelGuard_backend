import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto";

export class CreatePostDto {
  @ApiProperty({ example: "Getting Started with NestJS" })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: "getting-started-with-nestjs" })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ example: "A beginner's guide to building REST APIs with NestJS." })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiProperty({ example: "Full markdown content goes here..." })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiPropertyOptional({ example: "https://example.com/cover.jpg" })
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiPropertyOptional({ example: true, default: false })
  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @ApiPropertyOptional({ example: ["nestjs", "backend", "typescript"] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdatePostDto {
  @ApiPropertyOptional({ example: "Updated Post Title" })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: "updated-post-slug" })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ example: "Updated summary" })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional({ example: "Updated content..." })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ example: "https://example.com/new-cover.jpg" })
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @ApiPropertyOptional({ example: ["tech", "coding"] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class PostQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: "nestjs", description: "Filter by tag" })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional({ example: true, description: "Filter by published status" })
  @IsOptional()
  @IsBoolean()
  published?: boolean;
}
