import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { User } from './entities/user.entity';
import { UserFollow } from './entities/user-follow.entity';
import { StorageService } from '../storage/storage.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { SearchUserDto } from './dto/search-user.dto';
import { EmailService } from '../email/email.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserFollow)
    private readonly userFollowRepository: Repository<UserFollow>,
    private readonly storageService: StorageService,
    private readonly emailService: EmailService,
  ) {}

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['pets'],
      select: ['id', 'first_name', 'last_name', 'username', 'email', 'bio', 'profile_picture', 'user_type', 'is_verified', 'followers', 'created_at'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.getUserById(id);

    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const existingUser = await this.userRepository.findOne({
        where: { username: updateUserDto.username },
      });
      
      if (existingUser) {
        throw new ConflictException('Username already exists');
      }
    }

    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async searchUsers(query: string, pagination: PaginationDto): Promise<PaginatedResult<User>> {
    if (!query || query.trim().length < 2) {
      throw new BadRequestException('Search query must be at least 2 characters long');
    }

    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const [users, total] = await this.userRepository.findAndCount({
      where: [
        { username: ILike(`%${query}%`) },
        { first_name: ILike(`%${query}%`) },
        { last_name: ILike(`%${query}%`) },
      ],
      select: ['id', 'first_name', 'last_name', 'username', 'profile_picture', 'is_verified', 'user_type', 'created_at'],
      skip,
      take: limit,
      order: { created_at: 'DESC' },
    });

    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    };
  }

  async uploadProfilePicture(userId: string, file: Express.Multer.File): Promise<User> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const user = await this.getUserById(userId);
    const imageUrl = await this.storageService.uploadFile(file, 'profiles');

    user.profile_picture = imageUrl;
    return this.userRepository.save(user);
  }

  async followUser(followerId: string, followeeId: string): Promise<{ message: string }> {
    if (followerId === followeeId) {
      throw new BadRequestException('Cannot follow yourself');
    }

    const existingFollow = await this.userFollowRepository.findOne({
      where: { follower_id: followerId, followee_id: followeeId },
    });

    if (existingFollow) {
      throw new ConflictException('Already following this user');
    }

    // Ensure both users exist before attempting to follow
    await Promise.all([
      this.getUserById(followerId),
      this.getUserById(followeeId),
    ]);

    const newFollow = this.userFollowRepository.create({
      follower_id: followerId,
      followee_id: followeeId,
    });
    await this.userFollowRepository.save(newFollow);

    // Atomically increment the counters
    await this.userRepository.increment({ id: followerId }, 'followings_count', 1);
    await this.userRepository.increment({ id: followeeId }, 'followers_count', 1);

    return { message: 'User followed successfully' };
  }

  async unfollowUser(followerId: string, followeeId: string): Promise<{ message: string }> {
    const follow = await this.userFollowRepository.findOne({
      where: { follower_id: followerId, followee_id: followeeId },
    });

    if (!follow) {
      throw new BadRequestException('Not following this user');
    }

    await this.userFollowRepository.remove(follow);

    // Atomically decrement the counters
    await this.userRepository.decrement({ id: followerId }, 'followings_count', 1);
    await this.userRepository.decrement({ id: followeeId }, 'followers_count', 1);

    return { message: 'User unfollowed successfully' };
  }

  async getFollowers(userId: string, pagination: PaginationDto): Promise<PaginatedResult<User>> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const [follows, total] = await this.userFollowRepository.findAndCount({
      where: { followee_id: userId },
      relations: ['follower'],
      skip,
      take: limit,
      order: { created_at: 'DESC' },
    });

    const followers = follows.map(follow => follow.follower);

    return {
      data: followers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    };
  }

  async getFollowing(userId: string, pagination: PaginationDto): Promise<PaginatedResult<User>> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const [follows, total] = await this.userFollowRepository.findAndCount({
      where: { follower_id: userId },
      relations: ['followee'],
      skip,
      take: limit,
      order: { created_at: 'DESC' },
    });

    const following = follows.map(follow => follow.followee);

    return {
      data: following,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    };
  }

  async blockUser(blockerId: string, blockedId: string): Promise<{ message: string }> {
    if (blockerId === blockedId) {
      throw new BadRequestException('Cannot block yourself');
    }

    const blocker = await this.getUserById(blockerId);
    
    if (!blocker.blocked_users) {
      blocker.blocked_users = [];
    }

    if (blocker.blocked_users.includes(blockedId)) {
      throw new ConflictException('User is already blocked');
    }

    blocker.blocked_users.push(blockedId);
    await this.userRepository.save(blocker);

    return { message: 'User blocked successfully' };
  }

  async unblockUser(blockerId: string, blockedId: string): Promise<{ message: string }> {
    const blocker = await this.getUserById(blockerId);

    if (!blocker.blocked_users?.includes(blockedId)) {
      throw new BadRequestException('User is not blocked');
    }

    blocker.blocked_users = blocker.blocked_users.filter(id => id !== blockedId);
    await this.userRepository.save(blocker);

    return { message: 'User unblocked successfully' };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { email: forgotPasswordDto.email } });
    
    if (!user) {
      // Don't reveal if email exists for security
      return { message: 'If the email exists, a reset link has been sent' };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // 1 hour expiry

    await this.userRepository.update(user.id, {
      reset_token: resetToken,
      reset_token_expires: resetTokenExpiry,
    });

    // Send reset email
    await this.emailService.sendPasswordResetEmail(user.email, resetToken);

    return { message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { 
        reset_token: resetPasswordDto.token,
      },
    });

    if (!user || !user.reset_token_expires || user.reset_token_expires < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(resetPasswordDto.new_password, saltRounds);

    await this.userRepository.update(user.id, {
      password: hashedPassword,
      reset_token: null,
      reset_token_expires: null,
    });

    return { message: 'Password reset successfully' };
  }

  async sendEmailVerification(email: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.is_email_verified) {
      throw new BadRequestException('Email is already verified');
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 10); // 10 minutes expiry

    await this.userRepository.update(user.id, {
      email_verification_otp: otp,
      email_verification_expires: otpExpiry,
    });

    // Send OTP email
    await this.emailService.sendOTPEmail(email, otp);

    return { message: 'Verification code sent to your email' };
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { 
        email: verifyEmailDto.email,
        email_verification_otp: verifyEmailDto.otp,
      },
    });

    if (!user || !user.email_verification_expires || user.email_verification_expires < new Date()) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    await this.userRepository.update(user.id, {
      is_email_verified: true,
      email_verification_otp: null,
      email_verification_expires: null,
    });

    return { message: 'Email verified successfully' };
  }

  async deleteUser(userId: string): Promise<{ message: string }> {
    const user = await this.getUserById(userId);
    await this.userRepository.remove(user);
    return { message: 'User deleted successfully' };
  }
}