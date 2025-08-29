import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PayHereCallbackDto } from './dto/payhere-callback.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../user/entities/user.entity';
import { Payment } from './entities/payment.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a payment' })
  @ApiResponse({ status: 201, description: 'Payment created successfully' })
  async createPayment(
    @Body() createPaymentDto: CreatePaymentDto,
    @CurrentUser() user: User,
  ) {
    return this.paymentService.createPayment(createPaymentDto, user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user payment history' })
  @ApiResponse({ status: 200, description: 'Payment history', type: [Payment] })
  async getPaymentHistory(
    @CurrentUser() user: User,
    @Query() pagination: PaginationDto,
  ) {
    return this.paymentService.getPaymentHistory(user.id, pagination);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiResponse({ status: 200, description: 'Payment details', type: Payment })
  async getPayment(@Param('id') id: string, @CurrentUser() user: User): Promise<Payment> {
    return this.paymentService.getPayment(id, user.id);
  }

  @Post('payhere/notify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'PayHere payment notification callback' })
  @ApiResponse({ status: 200, description: 'Payment notification processed' })
  async payHereNotify(@Body() callbackDto: PayHereCallbackDto): Promise<{ message: string }> {
    return this.paymentService.handlePayHereCallback(callbackDto);
  }

  @Post('payhere/return')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'PayHere payment return URL' })
  @ApiResponse({ status: 200, description: 'Payment return processed' })
  async payHereReturn(@Body() callbackDto: PayHereCallbackDto): Promise<{ message: string; redirect_url: string }> {
    const result = await this.paymentService.handlePayHereReturn(callbackDto);
    return {
      message: 'Payment processed successfully',
      redirect_url: result.success ? '/payment/success' : '/payment/failed',
    };
  }
}