# File Manager - Frontend

A simple, responsive file management application built with React, TypeScript, and Vite. This application provides an intuitive interface for uploading, searching, downloading, and managing files with support for content-based search.

## Features

### Core Functionality

- **File Upload**: Multi-file upload with drag-and-drop support and real-time progress tracking
- **File Management**: List, download, and delete files with confirmation dialogs
- **Search**: Dual search modes - filename search and content-based search (supports txt, pdf, md, and docx)
- **Responsive Design**: Adaptive UI that switches between table view (desktop) and card view (mobile)
- **Real-time Feedback**: Toast notifications for all operations (success, error, warnings)

### User Experience

- **Drag & Drop**: Drop files anywhere on the page for instant upload
- **Upload Progress**: Individual progress bars for each file being uploaded
- **Debounced Search**: Optimized search with 250ms debounce to reduce API calls
- **Empty States**: Helpful empty state messages when no files are found
- **Loading States**: Clear loading indicators during data fetching

### File Information Display

- File name with extension badge
- File size (human-readable format)
- Upload date and time
- Total files count and storage statistics

## Tech Stack

### Core

- **Bun** - JavaScript runtime and package manager
- **React 19.1.1** - UI library
- **TypeScript 5.9.3** - Type safety
- **Vite** (Rolldown) - Build tool and dev server

### UI Components & Styling

- **Tailwind CSS v4.1.3** - Utility-first CSS
- **Radix UI** - Accessible component primitives (alert-dialog, checkbox, label, progress, tooltip)
- **Lucide React** - Icon library
- **Sonner** - Toast notifications
- **Class Variance Authority** - Component variant management

### API Communication

- **Elysia Eden (Treaty)** - Type-safe API client for backend communication
- Custom XMLHttpRequest implementation for upload progress tracking

### Utilities

- Custom debounce hook for search optimization
- Mobile detection hook for responsive UI
- File size and date formatting utilities

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Radix UI based components
│   ├── Files.tsx       # Responsive file list wrapper
│   ├── FileTable.tsx   # Desktop table view
│   ├── FileCards.tsx   # Mobile card view
│   ├── SearchBar.tsx   # Search input with content search toggle
│   ├── LoadingWrapper.tsx # Loading state handler
│   ├── EmptyDataHandler.tsx # Empty state handler
│   └── Footer.tsx      # Application footer for files statistics
├── pages/
│   └── Home.tsx        # Main application page
├── queries/            # API interaction layer
│   ├── queryClient.ts  # Eden Treaty client setup
│   ├── uploadFile.ts   # Upload with progress tracking
│   ├── getFiles.ts     # Fetch files list
│   ├── getFile.ts      # Download file
│   └── deleteFile.ts   # Delete file
├── utils/              # Helper functions and hooks
│   ├── index.ts        # Formatting utilities
│   ├── useDebounce.ts  # Debounce hook
│   └── use-mobile.ts   # Mobile detection hook
├── App.tsx             # Root component
└── main.tsx            # Application entry point
```

## Getting Started

### Prerequisites

- **Bun** - Fast JavaScript runtime and package manager ([Install Bun](https://bun.sh))
- Backend API running on `http://localhost:3000`

### Installation

```bash
bun install
```

### Development

```bash
bun dev
```

This starts the Vite development server with Hot Module Replacement (HMR). (Not tested)

### Build

```bash
bun run build
```

Compiles TypeScript and builds the production bundle.

### Preview

```bash
bun run preview
```

Preview the production build locally.

### Linting

```bash
bun run lint
```

Runs ESLint to check code quality.

## API Integration

The frontend communicates with a backend API running on port 3000:

- **GET** `/api/files` - List files with optional search parameters
- **POST** `/api/upload` - Upload files (multipart/form-data)
- **GET** `/api/file/:id` - Download a file
- **DELETE** `/api/file/:id` - Delete a file

Type-safe API calls are handled through Elysia Eden Treaty client, providing full TypeScript support and autocompletion.

## Key Features Implementation

### Upload with Progress

Uses native XMLHttpRequest to track upload progress for each file, displaying real-time progress bars with completion states.

### Content Search

Toggle between filename search and full-content search. Content search supports text extraction from txt, pdf, md, and docx files.

### Responsive Views

Automatically switches between table view (desktop) and card view (mobile) using a custom hook that detects screen size.

## Configuration

- **Vite Config**: Uses `@vitejs/plugin-react` for Fast Refresh
- **TypeScript**: Separate configs for app (`tsconfig.app.json`) and tooling (`tsconfig.node.json`)
- **ESLint**: Modern flat config with React-specific rules
