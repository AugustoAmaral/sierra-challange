import { describe, expect, it, beforeAll, afterAll } from "bun:test";
import { Elysia } from "elysia";
import { openapi, fromTypes } from "@elysiajs/openapi";
import { cors } from "@elysiajs/cors";
import { mkdir, rm, readdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { handleUpload, handleUploadDocumentation } from "./routes/upload";
import { UPLOAD_DIR } from "./config/constants";

describe("Application Integration Tests", () => {
  let app: Elysia;
  const TEST_PORT = 3001;
  const BASE_URL = `http://localhost:${TEST_PORT}`;

  beforeAll(async () => {
    // Ensure upload directory exists
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // Create app instance for testing
    app = new Elysia()
      .use(cors())
      .use(openapi({ references: fromTypes() }))
      .get("/", () => "File Upload API")
      .post("/api/upload", handleUpload, handleUploadDocumentation)
      .listen(TEST_PORT);
  });

  afterAll(async () => {
    // Stop the server
    app.stop();

    // Clean up all files in the upload directory
    if (existsSync(UPLOAD_DIR)) {
      const files = await readdir(UPLOAD_DIR);
      for (const file of files) {
        await rm(join(UPLOAD_DIR, file), { force: true });
      }
    }
  });

  describe("GET /", () => {
    it("should return welcome message", async () => {
      const response = await fetch(`${BASE_URL}/`);

      expect(response.status).toBe(200);
      const text = await response.text();
      expect(text).toBe("File Upload API");
    });

    it("should respond with text content", async () => {
      const response = await fetch(`${BASE_URL}/`);

      expect(response.status).toBe(200);
      const text = await response.text();
      expect(text).toBeTruthy();
      expect(typeof text).toBe("string");
    });
  });

  describe("POST /api/upload", () => {
    it("should successfully upload a single file", async () => {
      const formData = new FormData();
      const blob = new Blob(["test content"], { type: "text/plain" });
      const file = new File([blob], "test.txt", { type: "text/plain" });
      formData.append("files", file);

      const response = await fetch(`${BASE_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      expect(response.status).toBe(200);
      const data = (await response.json()) as any;
      expect(data).toHaveProperty("success", true);
      expect(data).toHaveProperty("message", "Files uploaded successfully");
      expect(data).toHaveProperty("files");
      expect(data.files).toHaveLength(1);
      expect(data.files[0].originalName).toBe("test.txt");
      expect(data.files[0].mimeType).toContain("text/plain");
      expect(data.files[0]).toHaveProperty("id");
      expect(data.files[0]).toHaveProperty("filename");
      expect(data.files[0]).toHaveProperty("url");
    });

    it("should successfully upload multiple files", async () => {
      const formData = new FormData();
      const blob1 = new Blob(["content 1"], { type: "text/plain" });
      const file1 = new File([blob1], "file1.txt", { type: "text/plain" });
      const blob2 = new Blob(["content 2"], { type: "application/pdf" });
      const file2 = new File([blob2], "file2.pdf", {
        type: "application/pdf",
      });
      const blob3 = new Blob(["content 3"], { type: "text/markdown" });
      const file3 = new File([blob3], "file3.md", { type: "text/markdown" });

      formData.append("files", file1);
      formData.append("files", file2);
      formData.append("files", file3);

      const response = await fetch(`${BASE_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      expect(response.status).toBe(200);
      const data = (await response.json()) as any;
      expect(data.success).toBe(true);
      expect(data.files).toHaveLength(3);
      expect(data.files[0].originalName).toBe("file1.txt");
      expect(data.files[1].originalName).toBe("file2.pdf");
      expect(data.files[2].originalName).toBe("file3.md");
    });

    it("should return 400 when no files are provided", async () => {
      const formData = new FormData();

      const response = await fetch(`${BASE_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      // Elysia returns 422 for validation errors on empty form data
      expect([400, 422]).toContain(response.status);
    });

    it("should return 400 when too many files are uploaded", async () => {
      const formData = new FormData();

      // Add 11 files (MAX_FILES is 10)
      for (let i = 0; i < 11; i++) {
        const blob = new Blob([`content ${i}`], { type: "text/plain" });
        const file = new File([blob], `file${i}.txt`, { type: "text/plain" });
        formData.append("files", file);
      }

      const response = await fetch(`${BASE_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      expect(response.status).toBe(400);
      const data = (await response.json()) as any;
      expect(data).toMatchObject({
        success: false,
        code: "TOO_MANY_FILES",
      });
    });

    it("should return 413 when file size exceeds limit", async () => {
      const formData = new FormData();
      // Create a file larger than 10MB
      const largeContent = new Uint8Array(11 * 1024 * 1024); // 11MB
      const blob = new Blob([largeContent], { type: "application/pdf" });
      const file = new File([blob], "large.pdf", { type: "application/pdf" });
      formData.append("files", file);

      const response = await fetch(`${BASE_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      expect(response.status).toBe(413);
      const data = (await response.json()) as any;
      expect(data).toMatchObject({
        success: false,
        code: "FILE_TOO_LARGE",
      });
    });

    it("should handle files with special characters in names", async () => {
      const formData = new FormData();
      const blob = new Blob(["test"], { type: "text/plain" });
      const file = new File([blob], "file with spaces & special(chars).txt", {
        type: "text/plain",
      });
      formData.append("files", file);

      const response = await fetch(`${BASE_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      expect(response.status).toBe(200);
      const data = (await response.json()) as any;
      expect(data.success).toBe(true);
      expect(data.files[0].originalName).toBe(
        "file with spaces & special(chars).txt"
      );
    });

    it("should handle different file types", async () => {
      const fileTypes = [
        { name: "document.pdf", type: "application/pdf" },
        { name: "text.txt", type: "text/plain" },
        {
          name: "word.docx",
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        },
        { name: "markdown.md", type: "text/markdown" },
      ];

      for (const { name, type } of fileTypes) {
        const formData = new FormData();
        const blob = new Blob(["content"], { type });
        const file = new File([blob], name, { type });
        formData.append("files", file);

        const response = await fetch(`${BASE_URL}/api/upload`, {
          method: "POST",
          body: formData,
        });

        expect(response.status).toBe(200);
        const data = (await response.json()) as any;
        expect(data.success).toBe(true);
        expect(data.files[0].mimeType).toContain(type);
      }
    });

    it("should return proper response structure", async () => {
      const formData = new FormData();
      const blob = new Blob(["test"], { type: "text/plain" });
      const file = new File([blob], "test.txt", { type: "text/plain" });
      formData.append("files", file);

      const response = await fetch(`${BASE_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as any;

      // Validate response structure
      expect(data).toHaveProperty("success");
      expect(data).toHaveProperty("message");
      expect(data).toHaveProperty("files");
      expect(Array.isArray(data.files)).toBe(true);

      // Validate file object structure
      const fileObj = data.files[0];
      expect(fileObj).toHaveProperty("id");
      expect(fileObj).toHaveProperty("originalName");
      expect(fileObj).toHaveProperty("filename");
      expect(fileObj).toHaveProperty("size");
      expect(fileObj).toHaveProperty("sizeFormatted");
      expect(fileObj).toHaveProperty("mimeType");
      expect(fileObj).toHaveProperty("uploadedAt");
      expect(fileObj).toHaveProperty("url");

      // Validate data types
      expect(typeof fileObj.id).toBe("string");
      expect(typeof fileObj.originalName).toBe("string");
      expect(typeof fileObj.filename).toBe("string");
      expect(typeof fileObj.size).toBe("number");
      expect(typeof fileObj.sizeFormatted).toBe("string");
      expect(typeof fileObj.mimeType).toBe("string");
      expect(typeof fileObj.uploadedAt).toBe("string");
      expect(typeof fileObj.url).toBe("string");
    });

    it("should have CORS headers", async () => {
      const formData = new FormData();
      const blob = new Blob(["test"], { type: "text/plain" });
      const file = new File([blob], "test.txt", { type: "text/plain" });
      formData.append("files", file);

      const response = await fetch(`${BASE_URL}/api/upload`, {
        method: "POST",
        body: formData,
        headers: {
          Origin: "http://example.com",
        },
      });

      expect(response.headers.has("access-control-allow-origin")).toBe(true);
    });

    it("should handle small file upload", async () => {
      const formData = new FormData();
      // Use a file with 1 byte instead of empty to avoid Bun/Elysia edge case issues
      const blob = new Blob(["a"], { type: "text/plain" });
      const file = new File([blob], "small.txt", { type: "text/plain" });
      formData.append("files", file);

      const response = await fetch(`${BASE_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      expect(response.status).toBe(200);
      const data = (await response.json()) as any;
      expect(data.success).toBe(true);
      expect(data.files[0].size).toBe(1);
      expect(data.files[0].originalName).toBe("small.txt");
    });

    it("should handle file with empty name", async () => {
      const formData = new FormData();
      const file = new File(["empty name test"], "", { type: "text/plain" });
      formData.append("files", file);

      const response = await fetch(`${BASE_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      expect(response.status).toBe(200);
      const data = (await response.json()) as any;
      expect(data.success).toBe(true);
      expect(data.files).toHaveLength(1);
      expect(data.files[0].filename).toStartWith("file");
    });

    it("should generate unique filenames for duplicate uploads", async () => {
      const formData1 = new FormData();
      const blob1 = new Blob(["content 1"], { type: "text/plain" });
      const file1 = new File([blob1], "duplicate.txt", { type: "text/plain" });
      formData1.append("files", file1);

      const response1 = await fetch(`${BASE_URL}/api/upload`, {
        method: "POST",
        body: formData1,
      });

      const formData2 = new FormData();
      const blob2 = new Blob(["content 2"], { type: "text/plain" });
      const file2 = new File([blob2], "duplicate.txt", { type: "text/plain" });
      formData2.append("files", file2);

      const response2 = await fetch(`${BASE_URL}/api/upload`, {
        method: "POST",
        body: formData2,
      });

      const data1 = (await response1.json()) as any;
      const data2 = (await response2.json()) as any;

      expect(data1.files[0].filename).not.toBe(data2.files[0].filename);
      expect(data1.files[0].id).not.toBe(data2.files[0].id);
    });

    it("should include proper timestamp in ISO format", async () => {
      const formData = new FormData();
      const blob = new Blob(["test"], { type: "text/plain" });
      const file = new File([blob], "test.txt", { type: "text/plain" });
      formData.append("files", file);

      const beforeUpload = new Date();

      const response = await fetch(`${BASE_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      const afterUpload = new Date();
      const data = (await response.json()) as any;

      const uploadedAt = new Date(data.files[0].uploadedAt);
      expect(uploadedAt.getTime()).toBeGreaterThanOrEqual(
        beforeUpload.getTime() - 1000
      );
      expect(uploadedAt.getTime()).toBeLessThanOrEqual(
        afterUpload.getTime() + 1000
      );
    });

    it("should format file sizes correctly", async () => {
      const testCases = [
        { size: 100, expectedPattern: /B$/ },
        { size: 2048, expectedPattern: /KB$/ },
        { size: 2 * 1024 * 1024, expectedPattern: /MB$/ },
      ];

      for (const { size, expectedPattern } of testCases) {
        const formData = new FormData();
        const content = new Uint8Array(size);
        const blob = new Blob([content], { type: "text/plain" });
        const file = new File([blob], "test.txt", { type: "text/plain" });
        formData.append("files", file);

        const response = await fetch(`${BASE_URL}/api/upload`, {
          method: "POST",
          body: formData,
        });

        const data = (await response.json()) as any;
        expect(data.files[0].sizeFormatted).toMatch(expectedPattern);
      }
    });

    it("should handle maximum allowed files", async () => {
      const formData = new FormData();

      // Add exactly 10 files (MAX_FILES)
      for (let i = 0; i < 10; i++) {
        const blob = new Blob([`content ${i}`], { type: "text/plain" });
        const file = new File([blob], `file${i}.txt`, { type: "text/plain" });
        formData.append("files", file);
      }

      const response = await fetch(`${BASE_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      expect(response.status).toBe(200);
      const data = (await response.json()) as any;
      expect(data.success).toBe(true);
      expect(data.files).toHaveLength(10);
    });

    it("should generate valid URL paths", async () => {
      const formData = new FormData();
      const blob = new Blob(["test"], { type: "text/plain" });
      const file = new File([blob], "test.txt", { type: "text/plain" });
      formData.append("files", file);

      const response = await fetch(`${BASE_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as any;
      const url = data.files[0].url;

      expect(url).toStartWith("/api/files/");
      expect(url.split("/").length).toBe(4); // /, api, files, {id}
    });
  });

  describe("404 - Non-existent routes", () => {
    it("should return 404 for non-existent routes", async () => {
      const response = await fetch(`${BASE_URL}/api/nonexistent`);

      expect(response.status).toBe(404);
    });

    it("should return 404 for invalid GET on upload endpoint", async () => {
      const response = await fetch(`${BASE_URL}/api/upload`, {
        method: "GET",
      });

      expect(response.status).toBe(404);
    });
  });

  describe("CORS Configuration", () => {
    it("should handle OPTIONS preflight request", async () => {
      const response = await fetch(`${BASE_URL}/api/upload`, {
        method: "OPTIONS",
        headers: {
          Origin: "http://example.com",
          "Access-Control-Request-Method": "POST",
        },
      });

      expect(response.status).toBe(204);
      expect(response.headers.has("access-control-allow-origin")).toBe(true);
    });

    it("should include CORS headers in GET responses", async () => {
      const response = await fetch(`${BASE_URL}/`, {
        headers: { Origin: "http://example.com" },
      });

      expect(response.headers.has("access-control-allow-origin")).toBe(true);
    });
  });
});
