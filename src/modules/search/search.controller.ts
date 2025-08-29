import { Controller, Get, Post, Body, Query, UseGuards, Optional } from '@nestjs/common';
import { SearchService } from './search.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreateSearchQueryDto } from './dto/create-search-query.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { User } from '../user/entities/user.entity';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Perform a search and log the query' })
  async search(
    @Body() createSearchQueryDto: CreateSearchQueryDto,
    @CurrentUser() user: User,
  ) {
    // Log the search query
    await this.searchService.logQuery(createSearchQueryDto, user.id);

    // The actual search logic (e.g., querying posts, users, hashtags) would go here.
    // This could be delegated to other services.
    // For now, we'll just return a confirmation message.
    return {
      message: `Search logged for query: '${createSearchQueryDto.query}'.`,
      note: 'Full search result implementation is pending.',
      results: [], // Placeholder for actual search results
    };
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get trending search queries' })
  getTrending() {
    return this.searchService.getTrending();
  }
}
