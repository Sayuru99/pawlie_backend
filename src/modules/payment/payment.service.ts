import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PayHereCallbackDto } from './dto/payhere-callback.dto';
import { Payment, PaymentStatus, PaymentType } from './entities/payment.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { plainToClass } from 'class-transformer';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly configService: ConfigService,
  ) {}

  async createPayment(createPaymentDto: CreatePaymentDto, userId: string) {
    const orderId = this.generateOrderId();

    const payment = this.paymentRepository.create({
      ...createPaymentDto,
      user_id: userId,
      order_id: orderId,
    });

    const savedPayment = await this.paymentRepository.save(payment);

    const paymentUrl = this.generatePayHereUrl(savedPayment);

    return {
      payment: savedPayment,
      payment_url: paymentUrl,
      order_id: orderId,
    };
  }

  async getPaymentHistory(userId: string, pagination: PaginationDto): Promise<PaginatedResult<Payment>> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const [payments, total] = await this.paymentRepository.findAndCount({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: payments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    };
  }

  async getPayment(paymentId: string, userId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
      relations: ['user'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.user_id !== userId) {
      throw new ForbiddenException('You can only view your own payments');
    }

    return payment;
  }

  async handlePayHereCallback(callbackDto: PayHereCallbackDto): Promise<{ message: string }> {
    const isValidSignature = this.verifyPayHereSignature(callbackDto);
    if (!isValidSignature) {
      throw new BadRequestException('Invalid PayHere signature');
    }

    const payment = await this.paymentRepository.findOne({
      where: { order_id: callbackDto.order_id },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const status = this.mapPayHereStatus(callbackDto.status_code);
    
    await this.paymentRepository.update(payment.id, {
      status,
      payhere_payment_id: callbackDto.payment_id,
      payhere_response: plainToClass(Object, callbackDto),
    });

    if (status === PaymentStatus.SUCCESS) {
      await this.handleSuccessfulPayment(payment);
    }

    return { message: 'Payment notification processed' };
  }

  async handlePayHereReturn(callbackDto: PayHereCallbackDto): Promise<{ success: boolean }> {
    const payment = await this.paymentRepository.findOne({
      where: { order_id: callbackDto.order_id },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return { success: callbackDto.status_code === 2 };
  }

  private generateOrderId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `PAWLIE_${timestamp}_${random}`.toUpperCase();
  }

  private generatePayHereUrl(payment: Payment): string {
    const merchantId = this.configService.get('PAYHERE_MERCHANT_ID');
    const merchantSecret = this.configService.get('PAYHERE_MERCHANT_SECRET');
    const isSandbox = this.configService.get('PAYHERE_SANDBOX') === 'true';

    const baseUrl = isSandbox 
      ? 'https://sandbox.payhere.lk/pay/checkout'
      : 'https://www.payhere.lk/pay/checkout';

    const hash = crypto
      .createHash('md5')
      .update(
        merchantId +
        payment.order_id +
        payment.amount.toString() +
        payment.currency +
        crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase()
      )
      .digest('hex')
      .toUpperCase();

    const params = new URLSearchParams({
      merchant_id: merchantId,
      return_url: `${this.configService.get('APP_URL')}/api/v1/payments/payhere/return`,
      cancel_url: `${this.configService.get('APP_URL')}/payment/cancelled`,
      notify_url: `${this.configService.get('APP_URL')}/api/v1/payments/payhere/notify`,
      order_id: payment.order_id,
      items: payment.description,
      currency: payment.currency,
      amount: payment.amount.toString(),
      hash,
    });

    return `${baseUrl}?${params.toString()}`;
  }

  private verifyPayHereSignature(callbackDto: PayHereCallbackDto): boolean {
    const merchantSecret = this.configService.get('PAYHERE_MERCHANT_SECRET');
    
    const hash = crypto
      .createHash('md5')
      .update(
        callbackDto.merchant_id +
        callbackDto.order_id +
        callbackDto.payhere_amount.toString() +
        callbackDto.payhere_currency +
        callbackDto.status_code.toString() +
        crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase()
      )
      .digest('hex')
      .toUpperCase();

    return hash === callbackDto.md5sig;
  }

  private mapPayHereStatus(statusCode: number): PaymentStatus {
    switch (statusCode) {
      case 2:
        return PaymentStatus.SUCCESS;
      case 0:
        return PaymentStatus.PENDING;
      case -1:
        return PaymentStatus.CANCELLED;
      case -2:
        return PaymentStatus.FAILED;
      case -3:
        return PaymentStatus.FAILED;
      default:
        return PaymentStatus.FAILED;
    }
  }

  private async handleSuccessfulPayment(payment: Payment): Promise<void> {
    switch (payment.payment_type) {
      case PaymentType.VERIFICATION:
        await this.handleVerificationPayment(payment);
        break;
      case PaymentType.PREMIUM_FEATURES:
        await this.handlePremiumFeaturesPayment(payment);
        break;
      case PaymentType.EXTRA_PET_PROFILE:
        await this.handleExtraPetProfilePayment(payment);
        break;
      case PaymentType.ADVERTISEMENT:
        await this.handleAdvertisementPayment(payment);
        break;
    }
  }

  private async handleVerificationPayment(payment: Payment): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + (payment.metadata?.subscription_months || 1));
    // await this.userService.updateVerification(payment.user_id, expiresAt);
  }

  private async handlePremiumFeaturesPayment(payment: Payment): Promise<void> {
    // Implementation depends on specific premium features
  }

  private async handleExtraPetProfilePayment(payment: Payment): Promise<void> {
    // Implementation would update user's pet limit
  }

  private async handleAdvertisementPayment(payment: Payment): Promise<void> {
    // Implementation would create ad campaign
  }
}