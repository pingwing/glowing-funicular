## Images API (NestJS)

Backend service for uploading, resizing, storing and listing images.

### Tech stack

- **Runtime**: Node.js (latest LTS)
- **Framework**: NestJS (Express platform)
- **Database**: PostgreSQL (via TypeORM)
- **Storage**: Local filesystem (`uploads` directory, mounted in Docker)
- **Image processing**: `sharp`
- **Docs**: OpenAPI v3 (Swagger UI at `/docs`)
- **Tests**: Jest (unit + e2e-ready config)

---

### Running locally (without Docker)

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   Copy `.env.example` to `.env` and adjust values if needed:

   ```bash
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=postgres
   DB_NAME=images
   PORT=3000
   ```

3. **Run PostgreSQL** (example)

   ```bash
   docker run --name images-db -p 5432:5432 -e POSTGRES_DB=images -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -d postgres:16
   ```

4. **Start the app in dev mode**

   ```bash
   npm run start:dev
   ```

5. **Access**

- API base URL: `http://localhost:3000/api`
- Swagger UI: `http://localhost:3000/docs`

---

### Running with Docker (recommended dev setup)

1. Build & start services:

   ```bash
   docker-compose up --build
   ```

2. Services:

- **app**: NestJS API on port `3000`
- **db**: PostgreSQL on port `5432`

The `uploads` directory is mounted as a volume so files are persisted.

---

### API

All endpoints are prefixed with `/api`.

#### **POST `/api/images`**

- **Description**: Uploads an image file, resizes it to the requested width/height and stores metadata in the database.
- **Request**: `multipart/form-data`
  - **file**: binary image file (jpeg, png, etc.)
  - **title**: string, required
  - **width**: integer, required, target width in pixels
  - **height**: integer, required, target height in pixels
- **Response**: `201 Created`

```json
{
  "id": "uuid",
  "url": "/uploads/1699615340000-123456789.jpg",
  "title": "My image",
  "width": 800,
  "height": 600
}
```

#### **GET `/api/images`**

- **Description**: Returns a paginated list of images.
- **Query params**:
  - **page**: integer, default `1`
  - **limit**: integer, default `10`
  - **title**: string, optional, _"title must contain {text}"_ filter (case-insensitive)
- **Response**: `200 OK`

```json
{
  "data": [
    {
      "id": "uuid",
      "url": "/uploads/1699615340000-123456789.jpg",
      "title": "Sunset by the lake",
      "width": 800,
      "height": 600
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 10
  }
}
```

#### **GET `/api/images/:id`**

- **Description**: Returns a single image by id.
- **Params**:
  - **id**: image identifier (UUID)
- **Response**: `200 OK` with the same shape as single item above, or `404` if not found.

---

### Tests

- **Unit tests**:

  ```bash
  npm test
  ```

- **e2e tests**:

  ```bash
  npm run test:e2e
  ```

- **Coverage**:

  ```bash
  npm run test:cov
  ```

The project is wired with Jest and Nest’s testing utilities; an example service test is provided for `ImagesService`.

---

### Notes

- TypeORM is configured with `synchronize: true` for development convenience. For production, you should disable this and use migrations instead.
- Uploaded files are stored on the local filesystem under `uploads/`. In production you can switch to S3/Azure/GCS by replacing the storage logic in `ImagesService`.


