import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Image } from './entities/image.entity';
import { CreateImageDto } from './dto/create-image.dto';
import { ListImagesQueryDto } from './dto/list-images-query.dto';
import * as fs from 'fs';
import { extname, join } from 'path';
import * as sharp from 'sharp';

@Injectable()
export class ImagesService {
  constructor(
    @InjectRepository(Image)
    private readonly imagesRepository: Repository<Image>,
  ) {}

  async create(file: Express.Multer.File, dto: CreateImageDto): Promise<Image> {
    const uploadsDir = join(process.cwd(), 'uploads');
    await fs.promises.mkdir(uploadsDir, { recursive: true });

    const extension = extname(file.originalname) || '.jpg';
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
    const targetPath = join(uploadsDir, filename);

    // Resize and optimize the image
    await sharp(file.buffer)
      .resize(dto.width, dto.height, {
        fit: 'cover',
      })
      .toFile(targetPath);

    const entity = this.imagesRepository.create({
      title: dto.title,
      filename,
      width: dto.width,
      height: dto.height,
    });

    return this.imagesRepository.save(entity);
  }

  async findAll(query: ListImagesQueryDto): Promise<{
    items: Image[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where = query.title
      ? {
          title: ILike(`%${query.title}%`),
        }
      : {};

    const [items, total] = await this.imagesRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      items,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<Image> {
    const image = await this.imagesRepository.findOne({ where: { id } });
    if (!image) {
      throw new NotFoundException(`Image with id ${id} not found`);
    }
    return image;
  }
}
