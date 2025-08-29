import {
  Controller,
  Post,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { LikeService } from './like.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../user/entities/user.entity';

@ApiTags('Likes')
@Controller('likes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LikeController {
  constructor(private readonly likeService: LikeService) {}

  @Post('posts/:postId')
  @ApiOperation({ summary: 'Like a post' })
  @ApiResponse({ status: 201, description: 'Post liked successfully' })
  async likePost(
    @Param('postId') postId: string,
    @CurrentUser() user: User,
  ): Promise<{ message: string; liked: boolean }> {
    return this.likeService.toggleLike(postId, user.id);
  }

  @Delete('posts/:postId')
  @ApiOperation({ summary: 'Unlike a post' })
  @ApiResponse({ status: 200, description: 'Post unliked successfully' })
  async unlikePost(
    @Param('postId') postId: string,
    @CurrentUser() user: User,
  ): Promise<{ message: string; liked: boolean }> {
    return this.likeService.toggleLike(postId, user.id);
  }
}