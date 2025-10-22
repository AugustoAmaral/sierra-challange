import { t, type Context } from "elysia";
import { writeFile } from "fs/promises";
import { join } from "path";
import type { UploadResponse, ErrorResponse } from "../types";
import { formatFileSize, generateUniqueFilename } from "../utils/fileUtils";
import { UPLOAD_DIR, MAX_FILE_SIZE, MAX_FILES } from "../config/constants";

export async function handleUpload({
  body,
  set,
}: Context): Promise<UploadResponse | ErrorResponse> {
  try {
    const files = body.files as File | File[];
    const fileArray = Array.isArray(files) ? files : [files];

    // Verify if files are provided
    if (!files || fileArray.length === 0) {
      set.status = 400;
      return {
        success: false,
        error: "No files provided",
        code: "NO_FILES",
      } as ErrorResponse;
    }

    // Verify maximum number of files
    if (fileArray.length > MAX_FILES) {
      set.status = 400;
      return {
        success: false,
        error: `Maximum ${MAX_FILES} files allowed per upload`,
        code: "TOO_MANY_FILES",
      } as ErrorResponse;
    }

    const uploadedFiles = [];

    for (const file of fileArray) {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        set.status = 413;
        return {
          success: false,
          error: "File size exceeds 10MB limit",
          code: "FILE_TOO_LARGE",
        } as ErrorResponse;
      }

      // Generate unique filename to avoid conflicts
      const { id, filename } = generateUniqueFilename(file.name);
      const filePath = join(UPLOAD_DIR, filename);

      // Save file to disk
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await writeFile(filePath, buffer);

      uploadedFiles.push({
        id,
        originalName: file.name || "file",
        filename,
        size: file.size,
        sizeFormatted: formatFileSize(file.size),
        mimeType: file.type,
        uploadedAt: new Date().toISOString(),
        url: `/api/files/${id}`,
      });
    }

    return {
      success: true,
      message: "Files uploaded successfully",
      files: uploadedFiles,
    } as UploadResponse;
  } catch (error) {
    console.error("Upload error:", error);
    set.status = 500;
    return {
      success: false,
      error: "Failed to process file",
      code: "PROCESSING_ERROR",
    } as ErrorResponse;
  }
}

export const handleUploadDocumentation = {
  body: t.Object(
    { files: t.Union([t.File(), t.Array(t.File())]) },
    {
      description:
        "Multipart form-data com o campo 'files' (aceita arquivo único ou múltiplos arquivos)",
    }
  ),
  detail: {
    summary: "Upload de arquivos",
    tags: ["upload", "files"],
  },
  response: {
    200: t.Object({
      success: t.Boolean(),
      message: t.String(),
      files: t.Array(
        t.Object({
          id: t.String(),
          originalName: t.String(),
          filename: t.String(),
          size: t.Number(),
          sizeFormatted: t.String(),
          mimeType: t.String(),
          uploadedAt: t.String(),
          url: t.String(),
        })
      ),
    }),
    400: t.Object({
      success: t.Literal(false),
      error: t.String(),
      code: t.String(), // e.g. NO_FILES, TOO_MANY_FILES, INVALID_FILE_TYPE
    }),
    413: t.Object({
      success: t.Literal(false),
      error: t.String(),
      code: t.String(), // e.g. FILE_TOO_LARGE
    }),
    500: t.Object({
      success: t.Literal(false),
      error: t.String(),
      code: t.String(), // e.g. PROCESSING_ERROR
    }),
  },
};
