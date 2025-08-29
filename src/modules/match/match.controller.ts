import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { MatchService } from './match.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../user/entities/user.entity';
import { Match } from './entities/match.entity';

@ApiTags('Matches')
@Controller('matches')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Post()
  @ApiOperation({ summary: 'Request a pet match' })
  @ApiResponse({ status: 201, description: 'Match request created successfully', type: Match })
  async create(@Body() createMatchDto: CreateMatchDto, @CurrentUser() user: User): Promise<Match> {
    return this.matchService.create(createMatchDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get matches for user pets' })
  @ApiResponse({ status: 200, description: 'List of matches', type: [Match] })
  async findUserMatches(@CurrentUser() user: User): Promise<Match[]> {
    return this.matchService.findUserMatches(user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Accept or reject a match' })
  @ApiResponse({ status: 200, description: 'Match status updated successfully', type: Match })
  async update(
    @Param('id') id: string,
    @Body() updateMatchDto: UpdateMatchDto,
    @CurrentUser() user: User,
  ): Promise<Match> {
    const match = await this.matchService.findOne(id);
    const canUpdate = await this.matchService.canUserUpdateMatch(match, user.id);
    
    if (!canUpdate) {
      throw new ForbiddenException('You can only update matches involving your pets');
    }
    
    return this.matchService.update(id, updateMatchDto);
  }
}