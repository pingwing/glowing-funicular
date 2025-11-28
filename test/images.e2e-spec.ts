import { INestApplication, Module, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import { ImagesModule } from '../src/images/images.module';
import { Image } from '../src/images/entities/image.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: ':memory:',
      dropSchema: true,
      entities: [Image],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Image]),
    ImagesModule,
  ],
})
class TestAppModule {}

describe('Images API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.setGlobalPrefix('api');

    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('should upload, list and fetch an image', async () => {
    const pngBase64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';
    const imageBuffer = Buffer.from(pngBase64, 'base64');

    // Upload image
    const uploadResponse = await request(app.getHttpServer())
      .post('/api/images')
      .field('title', 'Test image')
      .field('width', '100')
      .field('height', '100')
      .attach('file', imageBuffer, {
        filename: 'test.png',
        contentType: 'image/png',
      })
      .expect(201);

    const uploaded = uploadResponse.body;
    expect(uploaded).toHaveProperty('id');
    expect(uploaded.title).toBe('Test image');
    expect(uploaded.width).toBe(100);
    expect(uploaded.height).toBe(100);
    expect(typeof uploaded.url).toBe('string');

    const imageId = uploaded.id;

    // List images
    const listResponse = await request(app.getHttpServer()).get('/api/images').expect(200);

    expect(Array.isArray(listResponse.body.data)).toBe(true);
    expect(listResponse.body.data.length).toBeGreaterThanOrEqual(1);
    const found = listResponse.body.data.find((img: any) => img.id === imageId);
    expect(found).toBeDefined();

    // Get single image
    const getResponse = await request(app.getHttpServer())
      .get(`/api/images/${imageId}`)
      .expect(200);

    expect(getResponse.body.id).toBe(imageId);
    expect(getResponse.body.title).toBe('Test image');
    expect(getResponse.body.width).toBe(100);
    expect(getResponse.body.height).toBe(100);
  });
});
