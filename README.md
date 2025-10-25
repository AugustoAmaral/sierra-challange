# Sierra Challenge - File Manager

A complete file management system with upload, content search, download, and deletion capabilities. Built with modern technologies focused on performance, type-safety, user and developer experience.

## 🎯 Project Philosophy

When I received the requirement to create a file management system with "the best experience possible", I decided to approach it pragmatically: build something simple and fast, yet scalable and well-architected. The goal was to create a solution that not only meets the basic requirements but also serves as a foundation for future enhancements - in fact, I plan to deploy this on my VPS as a personal file management system.

## 🏗️ Architecture Decisions

### Monorepo Structure

I chose a **monorepo architecture** to facilitate code sharing between frontend and backend, enabling end-to-end type-safety with Elysia's Eden Treaty. This decision significantly improved the development experience and reduced potential runtime errors.

```
sierra-challenge/
├── backend/              # Elysia REST API
│   ├── src/
│   │   ├── routes/      # API endpoints
│   │   ├── utils/       # Utility functions
│   │   └── types/       # Shared TypeScript definitions
│   └── files/           # File storage directory
│
└── frontend/            # React SPA
    └── src/
        ├── components/  # Reusable UI components
        └── queries/     # Type-safe API integration
```

### Why Bun?

I selected **[Bun](https://bun.sh/)** as the runtime for several strategic reasons:

- **Native TypeScript** - No compilation step, direct `.ts` execution
- **Exceptional Performance** - Faster than Node.js in benchmarks
- **All-in-One Toolchain** - Package manager, bundler, and test runner built-in
- **Developer Experience** - Instant startup and ultra-fast package installation

### Backend Design Philosophy

For the backend, I prioritized **simplicity without sacrificing quality**:

- **No database** - Used filesystem storage with UUID-based naming to avoid conflicts
- **Stateless design** - Each request reads from disk, ensuring data consistency
- **Type-safe API** - Elysia provides end-to-end type safety with the frontend

#### Key Trade-offs Considered

1. **File Reading Strategy**: I considered implementing an in-memory cache to avoid repeated disk reads, especially for content search. However, I opted for direct filesystem reads to maintain simplicity in this initial version.

2. **Content Processing**: I evaluated using workers for file content extraction to avoid blocking the event loop, but decided against it for the MVP, keeping the implementation straightforward.

3. **File Naming**: I concatenated original filenames with UUIDs (`${originalName}${uuid}.${extension}`) to preserve meaningful names while avoiding conflicts - no intermediate database needed.

## 🚀 Development Process

### 1. Design Phase

I started by using Figma's AI to generate an initial design concept:

```md
I want to create a single-page website, basically a file upload page with a search field.
This page will only have a search field at the top that will filter files,
and below it a table with the file list showing: filename, size, date/time added,
and an actions column with delete or download options.
```

After some iterations, I extracted the generated code, removed unnecessary elements, and refined it to create a clean, functional interface.

### 2. Backend Implementation

I followed a **test-driven approach**, building each route with its corresponding test suite before moving to integration:

```md
POST /api/upload # Multi-file upload with validation
GET /api/files # List with search (filename + content)
GET /api/file/:id # Download preserving original name
DELETE /api/file/:id # Secure deletion
```

**137 tests** were written to ensure robust functionality and edge case handling.

### Technical Challenge: Bun Test Mock Isolation

During test development, I encountered a significant challenge with Bun's testing framework: **module mocks were not isolated between test files**. This meant that mocked modules were being shared across different test suites, causing unpredictable test results and false failures.

Despite using `mock.restore()` as documented, the issue persisted. After deeper investigation and extensive documentation research, I discovered this is a **known limitation** with an open issue on Bun's GitHub repository.

**My Solution**: Rather than abandoning Bun or compromising test coverage, I adapted my testing strategy:

- Restructured test suites to avoid conflicting mocks
- Implemented alternative mocking patterns where isolation was critical
- Maintained comprehensive test coverage despite the limitation

This experience reinforced my ability to work with emerging technologies, navigate their limitations, and deliver quality results without compromising standards.

### 3. Frontend Integration

After completing the API, I integrated the frontend using **Eden Treaty** for type-safe communication:

- Removed all mocks and connected real endpoints
- Made some UX improvements like adding progress indicators for uploads, toast notifications and loading states
- Improved and fixed minor bugs on the responsive design (table for desktop, cards for mobile)

## 📋 Key Features

### Core Functionality

- ✅ **Multiple file uploads** with drag & drop support
- ✅ **Advanced search** within PDFs, DOCX, TXT, and MD files
- ✅ **Smart file naming** - Preserves original names with UUID collision prevention
- ✅ **Responsive interface** - Automatic adaptation for mobile/desktop

### Technical Highlights

- 🔐 **End-to-end type safety** via Elysia Eden Treaty
- 🧪 **100% test coverage** on critical paths, **>95%** overall coverage
- ⚡ **Optimized performance** leveraging Bun's speed
- 📝 **Auto-generated OpenAPI/Swagger** documentation at `/openapi`

## 🔧 Tech Stack

### Backend

- **Runtime**: Bun 1.x
- **Framework**: Elysia (optimized for Bun)
- **File Processing**: mammoth (DOCX), pdf-parse (PDF)
- **Testing**: Built-in Bun test runner (with custom adaptations)

### Frontend

- **Framework**: React 19.1.1 with TypeScript 5.9.3
- **Build Tool**: Vite with Rolldown
- **Styling**: Tailwind CSS v4.1.3
- **Components**: Radix UI for accessibility

## 🚀 Running the Project

### Prerequisites

[Install Bun](https://bun.com/docs/installation):

```bash
curl -fsSL https://bun.sh/install | bash
```

or if you already have node installed

```bash
npm install -g bun
```

### Backend

```bash
cd backend
bun install
bun dev  # Starts at http://localhost:3000
```

### Frontend

```bash
cd frontend
bun install
bun dev  # Starts at http://localhost:5173
```

### Testing

```bash
cd backend
bun test          # Run all tests
bun test:watch    # Development mode
bun test:coverage # Coverage report
```

## 📡 API Reference

Full interactive API documentation is available at **`http://localhost:3000/openapi`** when running the backend.

| Endpoint        | Method | Description                                     |
| --------------- | ------ | ----------------------------------------------- |
| `/api/upload`   | POST   | Upload multiple files (max 10 files, 10MB each) |
| `/api/files`    | GET    | List files with optional content search         |
| `/api/file/:id` | GET    | Download file with original name                |
| `/api/file/:id` | DELETE | Remove file from system                         |

### Query Parameters (GET /api/files)

- `textSearch` - Search term for filename/content
- `content` - Enable content search (boolean)
- `limit` - Results per page (default: 20)
- `offset` - Pagination offset (default: 0)

## 🤝 Final Thoughts

This project demonstrates my approach to software development: starting with a solid architectural foundation, making pragmatic trade-offs, and maintaining code quality through comprehensive testing. Even when faced with framework limitations (like Bun's mock isolation issue), I adapt and find solutions rather than compromise on quality. The result is a solid system that's both simple to understand and ready to scale.

---

**Built with ⚡ Bun and 💙 TypeScript**
