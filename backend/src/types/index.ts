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
