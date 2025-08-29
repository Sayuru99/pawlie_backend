import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

import { User } from '../user/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserType } from '@/common/enums/user-type.enum';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, username, password, first_name, last_name, user_type } = registerDto;

    
    const existingUser = await this.userRepository.findOne({
      where: [{ email }, { username }],
    });

    if (existingUser) {
      throw new ConflictException('User with this email or username already exists');
    }

    
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    
    const newUser = this.userRepository.create({
      first_name,
      last_name,
      username,
      email,
      password: hashedPassword,
      user_type,
    });

    const savedUser = await this.userRepository.save(newUser);

    
    const { accessToken, refreshToken } = await this.generateTokens(savedUser);

    return {
      user: this.sanitizeUser(savedUser),
      accessToken,
      refreshToken,
    };
  }

async validateUser(email: string, password: string): Promise<any> {
  console.log('AuthService.validateUser received:', { email, password });
  if (!email || !password) {
    throw new BadRequestException('Email and password are required');
  }

  const user = await this.userRepository
    .createQueryBuilder('user')
    .where('user.email = :email', { email })
    .addSelect('user.password') 
    .getOne();

  if (!user) {
    throw new UnauthorizedException('Invalid credentials');
  }

  if (!user.password) {
    throw new UnauthorizedException('User password not set');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new UnauthorizedException('Invalid credentials');
  }

  return this.sanitizeUser(user);
}

  async login(user: any): Promise<AuthResponseDto> {
    const dbUser = await this.userRepository.findOne({ where: { id: user.id } });
    const { accessToken, refreshToken } = await this.generateTokens(dbUser);

    return {
      user,
      accessToken,
      refreshToken,
    };
  }


  async logout(userId: string): Promise<{ message: string }> {
    
    
    return { message: 'Logged out successfully' };
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['pets'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.sanitizeUser(user);
  }

  async refreshToken(refreshToken: string): Promise<AuthResponseDto> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.userRepository.findOne({ where: { id: payload.sub } });
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const { accessToken, refreshToken: newRefreshToken } = await this.generateTokens(user);

      return {
        user: this.sanitizeUser(user),
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      // Don't reveal if email exists
      return { message: 'If the email exists, a reset link has been sent' };
    }

    // Generate reset token
    const resetToken = require('crypto').randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1);

    await this.userRepository.update(user.id, {
      reset_token: resetToken,
      reset_token_expires: resetTokenExpiry,
    });
    
    return { message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { reset_token: token },
    });

    if (!user || !user.reset_token_expires || user.reset_token_expires < new Date()) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await this.userRepository.update(user.id, {
      password: hashedPassword,
      reset_token: null,
      reset_token_expires: null,
    });
    
    return { message: 'Password reset successfully' };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { email_verification_otp: token },
    });

    if (!user || !user.email_verification_expires || user.email_verification_expires < new Date()) {
      throw new UnauthorizedException('Invalid or expired verification token');
    }

    await this.userRepository.update(user.id, {
      is_email_verified: true,
      email_verification_otp: null,
      email_verification_expires: null,
    });
    
    return { message: 'Email verified successfully' };
  }

  async validateGoogleUser(googleUser: any): Promise<any> {
    const { email, first_name, last_name, profile_picture, google_id } = googleUser;
    
    // Check if user already exists
    let user = await this.userRepository.findOne({ where: { email } });
    
    if (user) {
      // Update user with Google info if not set
      if (!user.profile_picture && profile_picture) {
        user.profile_picture = profile_picture;
        await this.userRepository.save(user);
      }
      return this.sanitizeUser(user);
    }
    
    // Create new user
    const username = email.split('@')[0] + Math.random().toString(36).substr(2, 4);
    user = this.userRepository.create({
      email,
      first_name,
      last_name,
      username,
      profile_picture,
      user_type: UserType.NORMAL,
      is_email_verified: true, // Google emails are pre-verified
    });
    
    const savedUser = await this.userRepository.save(user);
    return this.sanitizeUser(savedUser);
  }
  private async generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email, user_type: user.user_type };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
    });

    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: User) {
    
    const { password, ...result } = user;
    return result;
  }
}