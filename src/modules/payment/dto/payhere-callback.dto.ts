import { IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PayHereCallbackDto {
  @ApiProperty({ description: 'Merchant ID' })
  @IsString()
  merchant_id: string;

  @ApiProperty({ description: 'Order ID' })
  @IsString()
  order_id: string;

  @ApiProperty({ description: 'PayHere payment ID' })
  @IsString()
  payment_id: string;

  @ApiProperty({ description: 'Payment amount' })
  @IsNumber()
  payhere_amount: number;

  @ApiProperty({ description: 'Currency' })
  @IsString()
  payhere_currency: string;

  @ApiProperty({ description: 'Status code' })
  @IsNumber()
  status_code: number;

  @ApiProperty({ description: 'MD5 signature' })
  @IsString()
  md5sig: string;

  @ApiPropertyOptional({ description: 'Custom 1' })
  @IsOptional()
  @IsString()
  custom_1?: string;

  @ApiPropertyOptional({ description: 'Custom 2' })
  @IsOptional()
  @IsString()
  custom_2?: string;

  @ApiPropertyOptional({ description: 'Method' })
  @IsOptional()
  @IsString()
  method?: string;

  @ApiPropertyOptional({ description: 'Status message' })
  @IsOptional()
  @IsString()
  status_message?: string;

  @ApiPropertyOptional({ description: 'Card holder name' })
  @IsOptional()
  @IsString()
  card_holder_name?: string;

  @ApiPropertyOptional({ description: 'Card number (masked)' })
  @IsOptional()
  @IsString()
  card_no?: string;
}