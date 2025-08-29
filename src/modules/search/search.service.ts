import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { SearchQuery } from './entities/search-query.entity';
import { CreateSearchQueryDto } from './dto/create-search-query.dto';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(SearchQuery)
    private readonly searchQueryRepository: Repository<SearchQuery>,
  ) {}

  async logQuery(
    dto: CreateSearchQueryDto,
    userId?: string,
  ): Promise<SearchQuery> {
    const searchQuery = this.searchQueryRepository.create({
      query: dto.query.toLowerCase().trim(), // Store queries in lowercase for consistent grouping
      user_id: userId,
    });
    return this.searchQueryRepository.save(searchQuery);
  }

  async getTrending(
    limit = 10,
  ): Promise<{ query: string; count: string }[]> {
    // Get queries from the last 24 hours
    const since = new Date();
    since.setDate(since.getDate() - 1);

    const results = await this.searchQueryRepository
      .createQueryBuilder('search_query')
      .select('search_query.query', 'query')
      .addSelect('COUNT(search_query.query)', 'count')
      .where('search_query.created_at >= :since', { since })
      .groupBy('search_query.query')
      .orderBy('count', 'DESC')
      .limit(limit)
      .getRawMany();

    return results;
  }
}
