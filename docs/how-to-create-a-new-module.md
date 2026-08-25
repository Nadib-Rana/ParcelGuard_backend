# How to Create a New Module

This guide demonstrates how to add a new domain feature module (e.g., `Products`, `Categories`, `Orders`) following this template's conventions in 4 simple steps.

---

## Step 1: Add the Model to `prisma/schema.prisma`

Define your entity model in `prisma/schema.prisma`:

```prisma
model Product {
  id          String   @id @default(uuid()) @db.Uuid
  title       String
  price       Float
  description String?  @db.Text
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@map("products")
}
```

Run migration to update your database:
```bash
npm run db:migrate
```

---

## Step 2: Create the DTOs (`src/modules/products/dto/product.dto.ts`)

```typescript
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto";

export class CreateProductDto {
  @ApiProperty({ example: "Wireless Mouse" })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 29.99 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: "Ergonomic 2.4G wireless mouse" })
  @IsOptional()
  @IsString()
  description?: string;
}

export class ProductQueryDto extends PaginationQueryDto {}
```

---

## Step 3: Create the Service and Controller

### `src/modules/products/products.service.ts`
```typescript
import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { PaginationUtil } from "../../common/utils/pagination.util";
import { CreateProductDto, ProductQueryDto } from "./dto/product.dto";

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ProductQueryDto) {
    const { skip, take, page, limit } = PaginationUtil.getSkipTake(query);
    const where = query.search
      ? { title: { contains: query.search, mode: "insensitive" as const } }
      : {};

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({ where, skip, take }),
      this.prisma.product.count({ where }),
    ]);

    return PaginationUtil.paginate(products, total, page, limit);
  }

  async create(dto: CreateProductDto) {
    return this.prisma.product.create({ data: dto });
  }
}
```

### `src/modules/products/products.controller.ts`
```typescript
import { Controller, Get, Post, Body, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { ProductsService } from "./products.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { Role } from "@prisma/client";
import { CreateProductDto, ProductQueryDto } from "./dto/product.dto";

@ApiTags("Products")
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: "List all products" })
  async findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post()
  @ApiOperation({ summary: "Create a product (Admin only)" })
  async create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }
}
```

---

## Step 4: Create the Module and Register in `AppModule`

### `src/modules/products/products.module.ts`
```typescript
import { Module } from "@nestjs/common";
import { ProductsController } from "./products.controller";
import { ProductsService } from "./products.service";

@Module({
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
```

Import `ProductsModule` inside `src/app.module.ts`:
```typescript
imports: [
  // ... other modules
  ProductsModule,
]
```

Your new module is now fully wired with validation, Swagger OpenAPI docs, RBAC, error handling, and standardized responses!
