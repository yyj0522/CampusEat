import { IsNotEmpty, IsString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer'; 

export class CreateReviewDto {
   @IsString()
   @IsNotEmpty()
   content: string;

   @Type(() => Number) 
   @IsNumber()
   @Min(1)
   @Max(5)
   rating: number;
}