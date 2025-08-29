import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { MapService } from './map.service';
import { NearbySearchDto } from './dto/nearby-search.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Map')
@Controller('map')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MapController {
  constructor(private readonly mapService: MapService) {}

  @Get('nearby')
  @ApiOperation({ summary: 'Find nearby pets, users, or professionals' })
  @ApiResponse({ status: 200, description: 'List of nearby entities' })
  async findNearby(@Query() searchDto: NearbySearchDto) {
    return this.mapService.findNearby(searchDto);
  }
}