import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { PaginationUtil } from "../../common/utils/pagination.util";
import { Role } from "../../common/enums";
import { CreatePostDto, UpdatePostDto, PostQueryDto } from "./dto/post.dto";
import { PostQueryUtil, POST_AUTHOR_SELECT } from "./utils/post-query.util";

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PostQueryDto) {
    const { skip, take, page, limit } = PaginationUtil.getSkipTake(query);
    const where = PostQueryUtil.buildWhereInput(query);
    const orderBy = PostQueryUtil.buildOrderBy(query);

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip,
        take,
        orderBy,
        include: { author: { select: POST_AUTHOR_SELECT } },
      }),
      this.prisma.post.count({ where }),
    ]);

    return PaginationUtil.paginate(posts, total, page, limit);
  }

  async findBySlug(slug: string) {
    const post = await this.prisma.post.findUnique({
      where: { slug },
      include: { author: { select: POST_AUTHOR_SELECT } },
    });

    if (!post) {
      throw new NotFoundException(`Post with slug '${slug}' not found`);
    }

    return post;
  }

  async findById(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: { author: { select: POST_AUTHOR_SELECT } },
    });

    if (!post) {
      throw new NotFoundException(`Post with ID '${id}' not found`);
    }

    return post;
  }

  async create(authorId: string, dto: CreatePostDto) {
    const slug = dto.slug || PostQueryUtil.generateSlug(dto.title);

    const existing = await this.prisma.post.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException("A post with this slug already exists");
    }

    return this.prisma.post.create({
      data: {
        title: dto.title,
        slug,
        summary: dto.summary,
        content: dto.content,
        coverImage: dto.coverImage,
        published: dto.published ?? false,
        tags: dto.tags || [],
        authorId,
      },
      include: { author: { select: POST_AUTHOR_SELECT } },
    });
  }

  async update(
    id: string,
    dto: UpdatePostDto,
    currentUser: { id: string; role: Role },
  ) {
    const post = await this.findById(id);

    if (
      post.authorId !== currentUser.id &&
      currentUser.role !== Role.SUPER_ADMIN &&
      currentUser.role !== Role.ADMIN
    ) {
      throw new ForbiddenException("You can only edit your own posts");
    }

    return this.prisma.post.update({
      where: { id },
      data: {
        title: dto.title,
        slug: dto.slug,
        summary: dto.summary,
        content: dto.content,
        coverImage: dto.coverImage,
        published: dto.published,
        tags: dto.tags,
      },
      include: { author: { select: POST_AUTHOR_SELECT } },
    });
  }

  async remove(id: string, currentUser: { id: string; role: Role }) {
    const post = await this.findById(id);

    if (
      post.authorId !== currentUser.id &&
      currentUser.role !== Role.SUPER_ADMIN &&
      currentUser.role !== Role.ADMIN
    ) {
      throw new ForbiddenException("You can only delete your own posts");
    }

    await this.prisma.post.delete({ where: { id } });
    return { message: "Post deleted successfully" };
  }
}
