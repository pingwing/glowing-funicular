import { ApiProperty } from '@nestjs/swagger';

export class ImageResponseDto {
  @ApiProperty({ description: 'Unique identifier of the image' })
  id!: string;

  @ApiProperty({ description: 'Title of the image' })
  title!: string;

  @ApiProperty({
    description: 'URL (relative) where the resized image can be accessed, e.g. /uploads/<filename>',
  })
  url!: string;

  @ApiProperty({ description: 'Width of the stored image in pixels' })
  width!: number;

  @ApiProperty({ description: 'Height of the stored image in pixels' })
  height!: number;
}
