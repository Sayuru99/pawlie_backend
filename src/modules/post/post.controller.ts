import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../user/entities/user.entity';
import { Post as PostEntity } from './entities/post.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Posts')
@Controller('posts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new post' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiResponse({ status: 201, description: 'Post created successfully', type: PostEntity })
  async create(
    @Body() createPostDto: CreatePostDto,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: User,
  ): Promise<PostEntity> {
    return this.postService.create(createPostDto, user.id, files);
  }

  @Get()
  @ApiOperation({ summary: 'Get posts with pagination' })
  @ApiResponse({ status: 200, description: 'List of posts', type: [PostEntity] })
  async findAll(@Query() pagination: PaginationDto): Promise<PostEntity[]> {
    return this.postService.findAll(pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific post by ID' })
  @ApiResponse({ status: 200, description: 'Post found', type: PostEntity })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async findOne(@Param('id') id: string): Promise<PostEntity> {
    return this.postService.findOne(id);
  }

  @Post(':id/sponsor')
  @ApiOperation({ summary: 'Sponsor a post' })
  @ApiResponse({ status: 200, description: 'Post sponsored successfully', type: PostEntity })
  async sponsorPost(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<PostEntity> {
    return this.postService.sponsorPost(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a post' })
  @ApiResponse({ status: 200, description: 'Post updated successfully', type: PostEntity })
  async update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @CurrentUser() user: User,
  ): Promise<PostEntity> {
    const post = await this.postService.findOne(id);
    if (post.user_id !== user.id) {
      throw new ForbiddenException('You can only update your own posts');
    }
    return this.postService.update(id, updatePostDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a post' })
  @ApiResponse({ status: 200, description: 'Post deleted successfully' })
  async remove(@Param('id') id: string, @CurrentUser() user: User): Promise<{ message: string }> {
    const post = await this.postService.findOne(id);
    if (post.user_id !== user.id) {
      throw new ForbiddenException('You can only delete your own posts');
    }
    await this.postService.remove(id);
    return { message: 'Post deleted successfully' };
  }

  @Post(':id/like')
  @ApiOperation({ summary: 'Like or unlike a post' })
  @ApiResponse({ status: 200, description: 'Post like status updated' })
  async toggleLike(@Param('id') id: string, @CurrentUser() user: User): Promise<{ liked: boolean; likes_count: number }> {
    return this.postService.toggleLike(id, user.id);
  }
}