import { t, type Context } from "elysia";
import type { BunFile } from "bun";
import { readdirSync } from "fs";
import { join } from "path";
import type { ErrorResponse } from "../types";
import { UPLOAD_DIR } from "../config/constants";
import { extractUUID, getOriginalName, getExtension } from "../utils/fileUtils";

export async function handleGetFile({
  params,
  set,
}: Context): Promise<BunFile | ErrorResponse> {
  try {
    const { id } = params as { id: string };

    if (!id || id.length !== 36) {
      set.status = 400;
      return {
        success: false,
        error: "Invalid file ID format",
        code: "INVALID_ID",
      } as ErrorResponse;
    }

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

    const file = Bun.file(filePath);

    set.headers = {
      "Content-Disposition": `attachment; filename="${originalName}.${extension}"`,
    };

    return file;
  } catch (error) {
    console.error("Get file error:", error);
    set.status = 500;
    return {
      success: false,
      error: "Failed to retrieve file",
      code: "PROCESSING_ERROR",
    } as ErrorResponse;
  }
}

export const handleGetFileDocumentation = {
  params: t.Object({
    id: t.String({
      description: "UUID of the file (36 characters)",
      minLength: 36,
      maxLength: 36,
    }),
  }),
  detail: {
    summary: "Download a file by UUID",
    tags: ["files", "download"],
    description: "Downloads a specific file by its UUID identifier",
  },
  response: {
    200: t.File({
      description: "Binary file data with appropriate headers",
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
