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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { BanUserDto } from './dto/ban-user.dto';
import { AdminAnalyticsDto } from './dto/admin-analytics.dto';
import { UpdateReportDto } from '../report/dto/update-report.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../user/entities/user.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { UserType } from '../../common/enums/user-type.enum';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserType.PROFESSIONAL) // Assuming admins are professional users
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('analytics')
  @ApiOperation({ summary: 'Get platform analytics' })
  @ApiResponse({ status: 200, description: 'Platform analytics', type: AdminAnalyticsDto })
  async getAnalytics(): Promise<AdminAnalyticsDto> {
    return this.adminService.getAnalytics();
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all users with pagination' })
  @ApiResponse({ status: 200, description: 'List of users' })
  async getAllUsers(@Query() pagination: PaginationDto) {
    return this.adminService.getAllUsers(pagination);
  }

  @Post('users/:id/ban')
  @ApiOperation({ summary: 'Ban a user' })
  @ApiResponse({ status: 200, description: 'User banned successfully' })
  async banUser(
    @Param('id') userId: string,
    @Body() banUserDto: BanUserDto,
    @CurrentUser() admin: User,
  ): Promise<{ message: string }> {
    return this.adminService.banUser(userId, banUserDto, admin.id);
  }

  @Post('users/:id/unban')
  @ApiOperation({ summary: 'Unban a user' })
  @ApiResponse({ status: 200, description: 'User unbanned successfully' })
  async unbanUser(
    @Param('id') userId: string,
    @CurrentUser() admin: User,
  ): Promise<{ message: string }> {
    return this.adminService.unbanUser(userId, admin.id);
  }

  @Delete('posts/:id')
  @ApiOperation({ summary: 'Delete a post (Admin action)' })
  @ApiResponse({ status: 200, description: 'Post deleted successfully' })
  async deletePost(
    @Param('id') postId: string,
    @CurrentUser() admin: User,
  ): Promise<{ message: string }> {
    return this.adminService.deletePost(postId, admin.id);
  }

  @Get('reports')
  @ApiOperation({ summary: 'Get all reports' })
  @ApiResponse({ status: 200, description: 'List of reports' })
  async getReports(@Query() pagination: PaginationDto) {
    return this.adminService.getReports(pagination);
  }

  @Patch('reports/:id')
  @ApiOperation({ summary: 'Update report status' })
  @ApiResponse({ status: 200, description: 'Report updated successfully' })
  async updateReport(
    @Param('id') reportId: string,
    @Body() updateReportDto: UpdateReportDto,
    @CurrentUser() admin: User,
  ) {
    return this.adminService.updateReport(reportId, updateReportDto, admin.id);
  }

  @Post('users/:id/notify')
  @ApiOperation({ summary: 'Send notification to user' })
  @ApiResponse({ status: 200, description: 'Notification sent successfully' })
  async notifyUser(
    @Param('id') userId: string,
    @Body('message') message: string,
    @CurrentUser() admin: User,
  ): Promise<{ message: string }> {
    return this.adminService.notifyUser(userId, message, admin.id);
  }
}