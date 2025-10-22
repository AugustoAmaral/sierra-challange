import { Elysia } from "elysia";
import { openapi, fromTypes } from "@elysiajs/openapi";
import { cors } from "@elysiajs/cors";
import { mkdir } from "fs/promises";
import { existsSync } from "fs";
import { UPLOAD_DIR, API_PORT } from "./config/constants";
import { handleUpload, handleUploadDocumentation } from "./routes/upload";

// Ensure the upload directory exists
if (!existsSync(UPLOAD_DIR)) {
  await mkdir(UPLOAD_DIR, { recursive: true });
}

const app = new Elysia()
  .use(cors())
  .use(openapi({ references: fromTypes() }))
  .get("/", () => "File Upload API")
  .post("/api/upload", handleUpload, handleUploadDocumentation)
  .listen(API_PORT);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
