import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ReportService } from './report.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../user/entities/user.entity';
import { Report } from './entities/report.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { UserType } from '../../common/enums/user-type.enum';

@ApiTags('Reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a report' })
  @ApiResponse({ status: 201, description: 'Report submitted successfully', type: Report })
  async create(@Body() createReportDto: CreateReportDto, @CurrentUser() user: User): Promise<Report> {
    return this.reportService.create(createReportDto, user.id);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserType.PROFESSIONAL) // Assuming admins are professional users
  @ApiOperation({ summary: 'Get all reports (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of reports' })
  async findAll(@Query() pagination: PaginationDto) {
    return this.reportService.findAll(pagination);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserType.PROFESSIONAL)
  @ApiOperation({ summary: 'Get report by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Report details', type: Report })
  async findOne(@Param('id') id: string): Promise<Report> {
    return this.reportService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserType.PROFESSIONAL)
  @ApiOperation({ summary: 'Update report status (Admin only)' })
  @ApiResponse({ status: 200, description: 'Report updated successfully', type: Report })
  async update(
    @Param('id') id: string,
    @Body() updateReportDto: UpdateReportDto,
    @CurrentUser() user: User,
  ): Promise<Report> {
    return this.reportService.update(id, updateReportDto, user.id);
  }
}