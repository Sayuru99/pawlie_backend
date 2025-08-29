import { Controller, Get, Param, Query } from '@nestjs/common';
import { HashtagService } from './hashtag.service';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { PaginationDto } from '@/common/dto/pagination.dto';

@ApiTags('hashtags')
@Controller('hashtags')
export class HashtagController {
  constructor(private readonly hashtagService: HashtagService) {}

  // Note: A full implementation of this endpoint would require the PostService.
  // To avoid circular dependencies (PostModule -> HashtagModule), this logic
  // is often placed in the PostService itself (e.g., a `findPostsByHashtag` method)
  // or a shared third service.
  // This is a placeholder to establish the API route.
  @Get(':name/posts')
  @ApiOperation({ summary: 'Get posts associated with a hashtag' })
  @ApiParam({ name: 'name', description: 'The name of the hashtag (without #)' })
  findPostsByHashtag(
    @Param('name') name: string,
    @Query() paginationDto: PaginationDto,
  ) {
    const { page, limit } = paginationDto;
    return {
      message: `Endpoint to get posts for hashtag #${name}.`,
      params: { name, page, limit },
      note: 'Full implementation pending in PostService to avoid circular dependencies.',
    };
    // Example of how it would be called:
    // return this.postService.findPostsByHashtag(name, paginationDto);
  }

  @Get('popular')
  @ApiOperation({ summary: 'Get a list of popular hashtags' })
  getPopularHashtags() {
    return {
      message: `Endpoint to get popular hashtags.`,
      note: 'Implementation pending.',
    };
    // Example of how it would be implemented in hashtag.service.ts:
    // return this.hashtagService.findPopular();
  }
}
