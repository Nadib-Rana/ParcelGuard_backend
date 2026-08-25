import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseUUIDPipe,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { PostsService } from "./posts.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { Public } from "../../common/decorators/public.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ResponseMessage } from "../../common/decorators/response-message.decorator";
import { Role } from "../../common/enums";
import { CreatePostDto, UpdatePostDto, PostQueryDto } from "./dto/post.dto";

@ApiTags("Posts")
@UseGuards(JwtAuthGuard)
@Controller("posts")
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: "Get paginated posts with search and tag filters" })
  @ResponseMessage("Posts retrieved successfully")
  async findAll(@Query() query: PostQueryDto) {
    return this.postsService.findAll(query);
  }

  @Public()
  @Get("slug/:slug")
  @ApiOperation({ summary: "Get a single post by slug" })
  @ResponseMessage("Post retrieved successfully")
  async findBySlug(@Param("slug") slug: string) {
    return this.postsService.findBySlug(slug);
  }

  @Public()
  @Get(":id")
  @ApiOperation({ summary: "Get a single post by ID" })
  @ResponseMessage("Post retrieved successfully")
  async findById(@Param("id", ParseUUIDPipe) id: string) {
    return this.postsService.findById(id);
  }

  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: "Create a new post (Authenticated)" })
  @ResponseMessage("Post created successfully")
  async create(
    @CurrentUser("id") authorId: string,
    @Body() dto: CreatePostDto,
  ) {
    return this.postsService.create(authorId, dto);
  }

  @ApiBearerAuth()
  @Patch(":id")
  @ApiOperation({ summary: "Update post (Author or Admin)" })
  @ResponseMessage("Post updated successfully")
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdatePostDto,
    @CurrentUser() user: { id: string; role: Role },
  ) {
    return this.postsService.update(id, dto, user);
  }

  @ApiBearerAuth()
  @Delete(":id")
  @ApiOperation({ summary: "Delete post (Author or Admin)" })
  @ResponseMessage("Post deleted successfully")
  async remove(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string; role: Role },
  ) {
    return this.postsService.remove(id, user);
  }
}
