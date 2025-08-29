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
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../user/entities/user.entity';
import { Comment } from './entities/comment.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Comments')
@Controller('comments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  @ApiOperation({ summary: 'Create a comment' })
  @ApiResponse({ status: 201, description: 'Comment created successfully', type: Comment })
  async create(@Body() createCommentDto: CreateCommentDto, @CurrentUser() user: User): Promise<Comment> {
    return this.commentService.create(createCommentDto, user.id);
  }

  @Get('post/:postId')
  @ApiOperation({ summary: 'Get comments for a post' })
  @ApiResponse({ status: 200, description: 'List of comments', type: [Comment] })
  async getPostComments(
    @Param('postId') postId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.commentService.getPostComments(postId, pagination);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a comment' })
  @ApiResponse({ status: 200, description: 'Comment updated successfully', type: Comment })
  async update(
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @CurrentUser() user: User,
  ): Promise<Comment> {
    const comment = await this.commentService.findOne(id);
    if (comment.user_id !== user.id) {
      throw new ForbiddenException('You can only update your own comments');
    }
    return this.commentService.update(id, updateCommentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiResponse({ status: 200, description: 'Comment deleted successfully' })
  async remove(@Param('id') id: string, @CurrentUser() user: User): Promise<{ message: string }> {
    const comment = await this.commentService.findOne(id);
    if (comment.user_id !== user.id) {
      throw new ForbiddenException('You can only delete your own comments');
    }
    await this.commentService.remove(id);
    return { message: 'Comment deleted successfully' };
  }
}