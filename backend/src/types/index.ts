export interface UploadedFile {
  id: string;
  originalName: string;
  filename: string;
  size: number;
  sizeFormatted: string;
  mimeType: string;
  uploadedAt: string;
  url: string;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  files: UploadedFile[];
}

export interface ErrorResponse {
  success: false;
  error: string;
  code: string;
}

export interface FileListItem {
  id: string;
  name: string;
  displayName: string;
  size: number;
  sizeFormatted: string;
  createdAt: string;
  extension: string;
  url: string;
}

export interface ListFilesResponse {
  success: boolean;
  files: FileListItem[];
  metadata: {
    total: number;
    totalSize: number;
    totalSizeFormatted: string;
    filteredFiles: number | null;
    filteredSize: number | null;
    filteredSizeFormatted: string | null;
    limit: number;
    offset: number;
  };
}
