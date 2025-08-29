import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiConsumes } from '@nestjs/swagger';

import { UserService } from './user.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SearchUserDto } from './dto/search-user.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { PaginationDto } from '@/common/dto/pagination.dto';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('search')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search users' })
  @ApiResponse({ status: 200, description: 'Search results', type: [User] })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  async searchUsers(@Query() searchUserDto: SearchUserDto) {
    return this.userService.searchUsers(searchUserDto.q, searchUserDto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User found', type: User })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(@Param('id') id: string) {
    return this.userService.getUserById(id);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile' })
  async updateProfile(@CurrentUser() user: User, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.updateUser(user.id, updateUserDto);
  }


  @Post('profile-picture')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload profile picture' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfilePicture(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.userService.uploadProfilePicture(user.id, file);
  }

  @Post('follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Follow or unfollow a user' })
  @ApiResponse({ status: 200, description: 'Follow status updated' })
  async toggleFollow(
    @CurrentUser() currentUser: User,
    @Body('userId') userId: string,
  ): Promise<{ following: boolean; message: string }> {
    const user = await this.userService.getUserById(userId);
    const isFollowing = currentUser.followings?.includes(userId) || false;
    
    if (isFollowing) {
      const result = await this.userService.unfollowUser(currentUser.id, userId);
      return { following: false, message: result.message };
    } else {
      const result = await this.userService.followUser(currentUser.id, userId);
      return { following: true, message: result.message };
    }
  }

  @Post(':id/follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Follow user' })
  async followUser(@CurrentUser() currentUser: User, @Param('id') userId: string) {
    return this.userService.followUser(currentUser.id, userId);
  }

  @Delete(':id/follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unfollow user' })
  async unfollowUser(@CurrentUser() currentUser: User, @Param('id') userId: string) {
    return this.userService.unfollowUser(currentUser.id, userId);
  }

  @Get(':id/followers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user followers' })
  async getFollowers(@Param('id') userId: string, @Query() pagination: PaginationDto) {
    return this.userService.getFollowers(userId, pagination);
  }

  @Get(':id/following')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get users being followed' })
  async getFollowing(@Param('id') userId: string, @Query() pagination: PaginationDto) {
    return this.userService.getFollowing(userId, pagination);
  }

  @Post(':id/block')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Block user' })
  async blockUser(@CurrentUser() currentUser: User, @Param('id') userId: string) {
    return this.userService.blockUser(currentUser.id, userId);
  }

  @Delete(':id/block')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unblock user' })
  async unblockUser(@CurrentUser() currentUser: User, @Param('id') userId: string) {
    return this.userService.unblockUser(currentUser.id, userId);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Password reset email sent' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    return this.userService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    return this.userService.resetPassword(resetPasswordDto);
  }

  @Post('send-verification')
  @ApiOperation({ summary: 'Send email verification OTP' })
  @ApiResponse({ status: 200, description: 'Verification code sent' })
  async sendEmailVerification(@Body('email') email: string): Promise<{ message: string }> {
    return this.userService.sendEmailVerification(email);
  }

  @Post('verify-email')
  @ApiOperation({ summary: 'Verify email with OTP' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto): Promise<{ message: string }> {
    return this.userService.verifyEmail(verifyEmailDto);
  }

  @Delete('account')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete user account' })
  @ApiResponse({ status: 200, description: 'Account deleted successfully' })
  async deleteAccount(@CurrentUser() user: User): Promise<{ message: string }> {
    return this.userService.deleteUser(user.id);
  }
}