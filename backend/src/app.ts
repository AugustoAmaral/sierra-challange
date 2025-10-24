import { Elysia } from "elysia";
import { mkdir } from "fs/promises";
import { existsSync } from "fs";
import { UPLOAD_DIR } from "./config/constants";
import { handleUpload, handleUploadDocumentation } from "./routes/upload";
import {
  handleListFiles,
  handleListFilesDocumentation,
} from "./routes/listFiles";
import { handleGetFile, handleGetFileDocumentation } from "./routes/getFile";

/**
 * Creates and configures the Elysia application instance
 * @returns Configured Elysia instance (without .listen() called)
 */
export async function createApp() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }

  const app = new Elysia()
    .get("/", () => "File Upload API")
    .post("/api/upload", handleUpload, handleUploadDocumentation)
    .get("/api/files", handleListFiles, handleListFilesDocumentation)
    .get("/api/files/:id", handleGetFile, handleGetFileDocumentation);

  return app;
}
