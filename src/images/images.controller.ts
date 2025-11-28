import {
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  Query,
  Param,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ImagesService } from './images.service';
import { CreateImageDto } from './dto/create-image.dto';
import { ListImagesQueryDto } from './dto/list-images-query.dto';
import { ImageResponseDto } from './dto/image-response.dto';
import { Image } from './entities/image.entity';

@ApiTags('images')
@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  private toResponseDto(image: Image): ImageResponseDto {
    return {
      id: image.id,
      title: image.title,
      width: image.width,
      height: image.height,
      url: `/uploads/${image.filename}`,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Upload and resize an image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Image file and metadata',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file to upload',
        },
        title: {
          type: 'string',
          description: 'Human-readable image title',
        },
        width: {
          type: 'integer',
          description: 'Target width in pixels',
          example: 800,
        },
        height: {
          type: 'integer',
          description: 'Target height in pixels',
          example: 600,
        },
      },
      required: ['file', 'title', 'width', 'height'],
    },
  })
  @ApiCreatedResponse({
    description: 'Image uploaded and resized successfully',
    type: ImageResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid payload or missing file' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB
      },
      fileFilter: (req, file, cb) => {
        if (file.mimetype?.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only image files are allowed'), false);
        }
      },
    }),
  )
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CreateImageDto,
  ): Promise<ImageResponseDto> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const image = await this.imagesService.create(file, body);
    return this.toResponseDto(image);
  }

  @Get()
  @ApiOperation({ summary: 'List images with optional filtering and pagination' })
  @ApiOkResponse({
    description: 'Paginated list of images',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/ImageResponseDto' },
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
          },
        },
      },
    },
  })
  @ApiQuery({
    name: 'title',
    required: false,
    description: 'Filter: title must contain this text (case-insensitive)',
  })
  async getImages(@Query() query: ListImagesQueryDto) {
    const { items, total, page, limit } = await this.imagesService.findAll(query);
    return {
      data: items.map((image) => this.toResponseDto(image)),
      meta: { total, page, limit },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single image by id' })
  @ApiParam({ name: 'id', description: 'Image id (UUID)' })
  @ApiOkResponse({
    description: 'Image found',
    type: ImageResponseDto,
  })
  async getImage(@Param('id', new ParseUUIDPipe()) id: string): Promise<ImageResponseDto> {
    const image = await this.imagesService.findOne(id);
    return this.toResponseDto(image);
  }
}
