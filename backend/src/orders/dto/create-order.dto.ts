import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, IsArray } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsOptional()
  alternativePhone?: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  district: string;

  @IsNumber()
  @Min(1)
  productId: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  quantity?: number;

  @IsString()
  @IsOptional()
  note?: string;

  @IsString()
  @IsOptional()
  productName?: string;

  @IsNumber()
  @IsOptional()
  productPrice?: number;

  @IsString()
  @IsOptional()
  productImage?: string;

  @IsArray()
  @IsOptional()
  items?: any[];
}
