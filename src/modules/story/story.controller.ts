import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { StoryService } from './story.service';
import { CreateStoryDto } from './dto/create-story.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../user/entities/user.entity';
import { Story } from './entities/story.entity';

@ApiTags('Stories')
@Controller('stories')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StoryController {
  constructor(private readonly storyService: StoryService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new story' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiResponse({ status: 201, description: 'Story created successfully', type: Story })
  async create(
    @Body() createStoryDto: CreateStoryDto,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: User,
  ): Promise<Story> {
    if (!file) {
      throw new BadRequestException('Media file is required for stories');
    }
    return this.storyService.create(createStoryDto, user.id, file);
  }

  @Get()
  @ApiOperation({ summary: 'Get active stories from followed users' })
  @ApiResponse({ status: 200, description: 'List of active stories', type: [Story] })
  async findActive(@CurrentUser() user: User): Promise<Story[]> {
    return this.storyService.findActiveStories(user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a story' })
  @ApiResponse({ status: 200, description: 'Story deleted successfully' })
  async remove(@Param('id') id: string, @CurrentUser() user: User): Promise<{ message: string }> {
    const story = await this.storyService.findOne(id);
    if (story.user_id !== user.id) {
      throw new ForbiddenException('You can only delete your own stories');
    }
    await this.storyService.remove(id);
    return { message: 'Story deleted successfully' };
  }
}