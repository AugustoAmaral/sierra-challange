# Sierra Challenge - Backend API

File management API built with **Elysia** and the **Bun runtime**.
It enables file upload, listing, search, download, and deletion with text extraction support.

## 🚀 Technologies

- **[Bun](https://bun.sh/)** – Ultra-fast JavaScript runtime
- **[Elysia](https://elysiajs.com/)** – Web framework optimized for Bun
- **TypeScript** – Static typing
- **OpenAPI/Swagger** – Automatic API documentation

## 📦 Dependencies

- `elysia` – Core web framework
- `@elysiajs/cors` – CORS middleware
- `@elysiajs/openapi` – OpenAPI documentation
- `mammoth` – Text extraction from `.docx` files
- `pdf-parse` – Text extraction from PDF files
- `uuid` – Unique identifier generation

## 🏗️ Project Structure

```
src/
├── app.ts              # Elysia app configuration
├── index.ts            # Server entry point
├── config/
│   └── constants.ts    # Constants and configurations
├── routes/
│   ├── upload.ts       # Upload endpoint
│   ├── listFiles.ts    # Listing endpoint
│   ├── getFile.ts      # Download endpoint
│   └── deleteFile.ts   # Deletion endpoint
├── types/
│   └── index.ts        # TypeScript definitions
└── utils/
    └── fileUtils.ts    # File manipulation utilities
```

## 🔌 API Endpoints

### POST `/api/upload`

Upload one or multiple files (maximum 10 per request).

- **Size limit**: 10MB per file
- **Body**: `multipart/form-data` with a `files` field
- **Response**: List of uploaded files with unique IDs

### GET `/api/files`

List files with search and pagination support.

- **Query params**:

  - `textSearch` (optional): Search term
  - `content` (optional): If `true`, searches inside file contents
  - `limit` (optional): Number of results (default: 20)
  - `offset` (optional): Skip results (default: 0)

- **Content search**: Supports PDF, DOCX, TXT, and MD

### GET `/api/file/:id`

Download a file by UUID.

- **Params**: `id` – File UUID (36 characters)
- **Response**: Binary file with `Content-Disposition` header

### DELETE `/api/file/:id`

Delete a file by UUID.

- **Params**: `id` – File UUID (36 characters)
- **Response**: Deletion confirmation with file metadata

## 🛠️ Configuration

### Environment Variables

The project uses different ports depending on the environment:

- **Development/Production**: Port 3000
- **Testing**: Port 3001

### Constants (`src/config/constants.ts`)

- `FILE_TYPES`: Supported MIME types (PDF, DOCX, TXT, MD)
- `UPLOAD_DIR`: Storage directory (`files/` or `test_uploads/`)
- `MAX_FILE_SIZE`: 10MB
- `MAX_FILES`: 10 files per upload
- `SEARCHABLE_EXTENSIONS`: Extensions supported for text search

## 💻 Development

### Installation

```bash
bun install
```

### Run development server

```bash
bun dev
```

The server will start at `http://localhost:3000`

### Run tests

```bash
# Run all tests
bun test

# Watch mode
bun run test:watch

# With coverage
bun run test:coverage
```

## 🧪 Tests

The project includes test coverage for all routes and utilities:

- `index.test.ts` – Application integration tests
- `routes/*.test.ts` – Endpoint tests
- `utils/fileUtils.test.ts` – Utility function tests

### Code Coverage

```
--------------------------|---------|---------|-------------------
File                      | % Funcs | % Lines | Uncovered Line #s
--------------------------|---------|---------|-------------------
All files                 |  100.00 |   95.03 |
 preload.ts               |  100.00 |  100.00 |
 src/app.ts               |  100.00 |  100.00 |
 src/config/constants.ts  |  100.00 |  100.00 |
 src/routes/deleteFile.ts |  100.00 |   86.73 | 25-30,70-76
 src/routes/getFile.ts    |  100.00 |   83.95 | 19-24,52-58
 src/routes/listFiles.ts  |  100.00 |   95.76 | 128-134
 src/routes/upload.ts     |  100.00 |   93.81 | 78-84
 src/utils/fileUtils.ts   |  100.00 |  100.00 |
--------------------------|---------|---------|-------------------

📊 137 tests passing | 100% functions | 95.03% lines
```

## 📋 Main Features

### File Management

- Multiple file uploads with size and quantity validation
- Automatically generated unique names (UUID)
- Original filename preservation
- Metadata extraction (size, type, date)

### Advanced Search

- Search by filename
- Search within file contents (PDF, DOCX, TXT, MD)
- Filter by file type
- Result pagination

### Utilities

- File size formatting (B, KB, MB, GB)
- UUID-based unique name generation
- Extraction of UUID and original filename
- Text extraction for multiple formats

## 📖 API Documentation

OpenAPI/Swagger documentation is automatically generated and can be accessed via the endpoint configured by `@elysiajs/openapi`.

## 🔒 Security

- File size validation (max 10MB)
- File quantity validation (max 10 per upload)
- UUID format validation
- Error handling with specific status codes
- CORS enabled for cross-origin requests
