import { t, type Context } from "elysia";
import { readdirSync, unlinkSync, statSync } from "fs";
import { join } from "path";
import type { ErrorResponse } from "../types";
import { UPLOAD_DIR } from "../config/constants";
import {
  extractUUID,
  getOriginalName,
  getExtension,
  formatFileSize,
} from "../utils/fileUtils";

interface DeleteFileResponse {
  success: boolean;
  message: string;
  deletedFile: {
    id: string;
    name: string;
    size: number;
    sizeFormatted: string;
  };
}

export async function handleDeleteFile({
  params,
  set,
}: Context): Promise<DeleteFileResponse | ErrorResponse> {
  try {
    const { id } = params as { id: string };

    // Validate UUID format
    if (!id || id.length !== 36) {
      set.status = 400;
      return {
        success: false,
        error: "Invalid file ID format",
        code: "INVALID_ID",
      } as ErrorResponse;
    }

    // Find the file in the upload directory
    const targetFile = readdirSync(UPLOAD_DIR).find((filename) => {
      const fileUUID = extractUUID(filename);
      return fileUUID === id;
    });

    if (!targetFile) {
      set.status = 404;
      return {
        success: false,
        error: "File not found",
        code: "FILE_NOT_FOUND",
      } as ErrorResponse;
    }

    const filePath = join(UPLOAD_DIR, targetFile);
    const extension = getExtension(targetFile);
    const originalName = getOriginalName(targetFile);

    // Get file size before deletion
    const stats = statSync(filePath);
    const fileSize = stats.size;

    // Delete the file
    unlinkSync(filePath);

    set.status = 200;
    return {
      success: true,
      message: "File deleted successfully",
      deletedFile: {
        id,
        name: `${originalName}.${extension}`,
        size: fileSize,
        sizeFormatted: formatFileSize(fileSize),
      },
    };
  } catch (error) {
    console.error("Delete file error:", error);
    set.status = 500;
    return {
      success: false,
      error: "Failed to delete file",
      code: "PROCESSING_ERROR",
    } as ErrorResponse;
  }
}

export const handleDeleteFileDocumentation = {
  params: t.Object({
    id: t.String({
      description: "UUID of the file (36 characters)",
      minLength: 36,
      maxLength: 36,
    }),
  }),
  detail: {
    summary: "Delete a file by UUID",
    tags: ["files", "delete"],
    description:
      "Deletes a specific file by its UUID identifier from the filesystem",
  },
  response: {
    200: t.Object({
      success: t.Literal(true),
      message: t.String(),
      deletedFile: t.Object({
        id: t.String(),
        name: t.String(),
        size: t.Number(),
        sizeFormatted: t.String(),
      }),
    }),
    400: t.Object({
      success: t.Literal(false),
      error: t.String(),
      code: t.String(), // INVALID_ID
    }),
    404: t.Object({
      success: t.Literal(false),
      error: t.String(),
      code: t.String(), // FILE_NOT_FOUND
    }),
    500: t.Object({
      success: t.Literal(false),
      error: t.String(),
      code: t.String(), // PROCESSING_ERROR
    }),
  },
};
