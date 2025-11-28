import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateImageDto {
  @ApiProperty({
    description: 'Human-readable title of the image',
    example: 'Sunset over the mountains',
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({
    description: 'Target width for the resized image in pixels',
    example: 800,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  width!: number;

  @ApiProperty({
    description: 'Target height for the resized image in pixels',
    example: 600,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  height!: number;
}
