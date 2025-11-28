import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import { ImagesService } from '../src/images/images.service';
import { Image } from '../src/images/entities/image.entity';
import { ListImagesQueryDto } from '../src/images/dto/list-images-query.dto';

// Mocks for the TypeORM repository
type MockRepo = Partial<Record<keyof Repository<any>, jest.Mock>>;

const createMockRepository = (): MockRepo => ({
  findAndCount: jest.fn(),
  create: jest.fn((entity) => entity),
  save: jest.fn((entity) => Promise.resolve(entity)),
});

// Mocks for sharp image processing
const mockResize = jest.fn().mockReturnThis();
const mockToFile = jest.fn().mockResolvedValue(undefined);

jest.mock('sharp', () => {
  return () => ({
    resize: mockResize,
    toFile: mockToFile,
  });
});

describe('ImagesService', () => {
  let service: ImagesService;
  let repo: MockRepo;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.spyOn(fs.promises, 'mkdir').mockResolvedValue(undefined as any);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImagesService,
        {
          provide: getRepositoryToken(Image),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<ImagesService>(ImagesService);
    repo = module.get<MockRepo>(getRepositoryToken(Image));
  });

  it('should paginate and return images', async () => {
    const query: ListImagesQueryDto = { page: 2, limit: 5 };
    const images: Image[] = [
      {
        id: '1',
        title: 'Test',
        filename: 'test.jpg',
        width: 800,
        height: 600,
        createdAt: new Date(),
      },
    ];

    (repo.findAndCount as jest.Mock).mockResolvedValue([images, 1]);

    const result = await service.findAll(query);

    expect(repo.findAndCount).toHaveBeenCalled();
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.page).toBe(2);
    expect(result.limit).toBe(5);
  });

  it('should apply title filter when listing images', async () => {
    const query: ListImagesQueryDto = { page: 1, limit: 10, title: 'sunset' };

    (repo.findAndCount as jest.Mock).mockResolvedValue([[], 0]);

    await service.findAll(query);

    expect(repo.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          title: expect.anything(),
        }),
      }),
    );
  });

  it('should scale/crop image to requested size using sharp', async () => {
    const file = {
      buffer: Buffer.from('fake-image'),
      originalname: 'test.png',
    } as Express.Multer.File;

    const dto = {
      title: 'Scaled image',
      width: 320,
      height: 240,
    } as any;

    const created = await service.create(file, dto);

    expect(mockResize).toHaveBeenCalledWith(320, 240, { fit: 'cover' });
    expect(mockToFile).toHaveBeenCalledTimes(1);
    expect(created.width).toBe(320);
    expect(created.height).toBe(240);
  });
});
