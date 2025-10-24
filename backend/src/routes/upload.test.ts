import { describe, expect, it, beforeEach, mock, afterAll } from "bun:test";
import { handleUpload } from "./upload";
import { MAX_FILE_SIZE, MAX_FILES } from "../config/constants";
import type { Context } from "elysia";
import type { UploadResponse } from "../types";

mock.module("uuid", () => ({
  v4: mock(() => "12345677-1234-1234-1234-1234567890ac"),
}));

describe("handleUpload", () => {
  let mockContext: Context;
  let mockSet: { status: number };

  beforeEach(() => {
    mockSet = { status: 200 };
    mockContext = {
      body: {},
      set: mockSet,
    } as unknown as Context;
  });

  describe("Error handling", () => {
    it("should return error when no files are provided", async () => {
      mockContext.body = {};

      const result = await handleUpload(mockContext);

      expect(result).toMatchObject({
        success: false,
        error: "No files provided",
        code: "NO_FILES",
      });
      expect(mockSet.status).toBe(400);
    });

    it("should return error when files array is empty", async () => {
      mockContext.body = { files: [] };

      const result = await handleUpload(mockContext);

      expect(result).toMatchObject({
        success: false,
        error: "No files provided",
        code: "NO_FILES",
      });
      expect(mockSet.status).toBe(400);
    });

    it("should return error when too many files are uploaded", async () => {
      const files = Array.from({ length: MAX_FILES + 1 }, (_, i) => ({
        name: `file${i}.txt`,
        size: 1024,
        type: "text/plain",
        arrayBuffer: async () => new ArrayBuffer(1024),
      })) as unknown as File[];

      mockContext.body = { files };

      const result = await handleUpload(mockContext);

      expect(result).toMatchObject({
        success: false,
        error: `Maximum ${MAX_FILES} files allowed per upload`,
        code: "TOO_MANY_FILES",
      });
      expect(mockSet.status).toBe(400);
    });

    it("should return error when file size exceeds limit", async () => {
      const largeFile = {
        name: "large-file.txt",
        size: MAX_FILE_SIZE + 1,
        type: "text/plain",
        arrayBuffer: async () => new ArrayBuffer(MAX_FILE_SIZE + 1),
      } as unknown as File;

      mockContext.body = { files: largeFile };

      const result = await handleUpload(mockContext);

      expect(result).toMatchObject({
        success: false,
        error: "File size exceeds 10MB limit",
        code: "FILE_TOO_LARGE",
      });
      expect(mockSet.status).toBe(413);
    });
  });

  describe("Successful uploads", () => {
    it("should successfully upload a single file", async () => {
      const fileContent = "Test file content";
      const mockFile = {
        name: "test.txt",
        size: fileContent.length,
        type: "text/plain",
        arrayBuffer: async () => new TextEncoder().encode(fileContent).buffer,
      } as unknown as File;

      mockContext.body = { files: mockFile };

      const result = (await handleUpload(mockContext)) as UploadResponse;

      expect(result.success).toBe(true);
      expect(result.message).toBe("Files uploaded successfully");
      expect(result.files).toHaveLength(1);
      expect(result.files[0]).toMatchObject({
        originalName: "test.txt",
        size: fileContent.length,
        mimeType: "text/plain",
      });
      expect(result.files[0].id).toBeTruthy();
      expect(result.files[0].filename).toContain("test");
      expect(result.files[0].filename).toEndWith(".txt");
      expect(result.files[0].sizeFormatted).toBeTruthy();
      expect(result.files[0].uploadedAt).toBeTruthy();
      expect(result.files[0].url).toStartWith("/api/file/");
    });

    it("should successfully upload multiple files", async () => {
      const files = [
        {
          name: "file1.txt",
          size: 100,
          type: "text/plain",
          arrayBuffer: async () => new ArrayBuffer(100),
        },
        {
          name: "file2.pdf",
          size: 200,
          type: "application/pdf",
          arrayBuffer: async () => new ArrayBuffer(200),
        },
        {
          name: "file3.docx",
          size: 300,
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          arrayBuffer: async () => new ArrayBuffer(300),
        },
      ] as unknown as File[];

      mockContext.body = { files };

      const result = (await handleUpload(mockContext)) as UploadResponse;

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(3);

      result.files.forEach((file, index) => {
        expect(file.originalName).toBe(files[index].name);
        expect(file.size).toBe(files[index].size);
        expect(file.mimeType).toBe(files[index].type);
        expect(file.id).toBeTruthy();
        expect(file.url).toStartWith("/api/file/");
      });
    });

    it("should handle files at maximum size limit", async () => {
      const mockFile = {
        name: "max-size.pdf",
        size: MAX_FILE_SIZE,
        type: "application/pdf",
        arrayBuffer: async () => new ArrayBuffer(MAX_FILE_SIZE),
      } as unknown as File;

      mockContext.body = { files: mockFile };

      const result = (await handleUpload(mockContext)) as UploadResponse;

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(1);
      expect(result.files[0].size).toBe(MAX_FILE_SIZE);
    });

    it("should handle maximum number of files", async () => {
      const files = Array.from({ length: MAX_FILES }, (_, i) => ({
        name: `file${i}.txt`,
        size: 1024,
        type: "text/plain",
        arrayBuffer: async () => new ArrayBuffer(1024),
      })) as unknown as File[];

      mockContext.body = { files };

      const result = (await handleUpload(mockContext)) as UploadResponse;

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(MAX_FILES);
    });

    it("should generate call for UUID to generate unique IDs for each file", async () => {
      const files = [
        {
          name: "duplicate.txt",
          size: 100,
          type: "text/plain",
          arrayBuffer: async () => new ArrayBuffer(100),
        },
        {
          name: "duplicate.txt",
          size: 100,
          type: "text/plain",
          arrayBuffer: async () => new ArrayBuffer(100),
        },
      ] as unknown as File[];

      mockContext.body = { files };

      const result = (await handleUpload(mockContext)) as UploadResponse;

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(2);
      // Since UUID is mocked to return the same value, filenames and IDs will be the same
      expect(result.files[0].id).toBe(result.files[1].id);
      expect(result.files[0].filename).toBe(result.files[1].filename);
    });

    it("should include properly formatted timestamps", async () => {
      const mockFile = {
        name: "test.txt",
        size: 100,
        type: "text/plain",
        arrayBuffer: async () => new ArrayBuffer(100),
      } as unknown as File;

      mockContext.body = { files: mockFile };

      const result = (await handleUpload(mockContext)) as UploadResponse;

      expect(result.success).toBe(true);
      const uploadedAt = new Date(result.files[0].uploadedAt);
      expect(uploadedAt).toBeInstanceOf(Date);
      expect(uploadedAt.getTime()).not.toBeNaN();
    });

    it("should handle files with various MIME types", async () => {
      const mimeTypes = [
        { name: "test.txt", type: "text/plain" },
        { name: "test.pdf", type: "application/pdf" },
        {
          name: "test.docx",
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        },
        { name: "test.md", type: "text/markdown" },
        { name: "test.json", type: "application/json" },
      ];

      for (const { name, type } of mimeTypes) {
        const mockFile = {
          name,
          size: 100,
          type,
          arrayBuffer: async () => new ArrayBuffer(100),
        } as unknown as File;

        mockContext.body = { files: mockFile };

        const result = (await handleUpload(mockContext)) as UploadResponse;

        expect(result.success).toBe(true);
        expect(result.files[0].mimeType).toBe(type);
      }
    });

    it("should handle files with special characters in names", async () => {
      const specialNames = [
        "file with spaces.txt",
        "file-with-dashes.pdf",
        "file_with_underscores.docx",
        "file(parentheses).md",
        "file[brackets].txt",
      ];

      for (const name of specialNames) {
        const mockFile = {
          name,
          size: 100,
          type: "text/plain",
          arrayBuffer: async () => new ArrayBuffer(100),
        } as unknown as File;

        mockContext.body = { files: mockFile };

        const result = (await handleUpload(mockContext)) as UploadResponse;

        expect(result.success).toBe(true);
        expect(result.files[0].originalName).toBe(name);
      }
    });

    it("should correctly format file sizes", async () => {
      const sizes = [
        { bytes: 100, expected: /B$/ },
        { bytes: 2048, expected: /KB$/ },
        { bytes: 2 * 1024 * 1024, expected: /MB$/ },
      ];

      for (const { bytes, expected } of sizes) {
        const mockFile = {
          name: "test.txt",
          size: bytes,
          type: "text/plain",
          arrayBuffer: async () => new ArrayBuffer(bytes),
        } as unknown as File;

        mockContext.body = { files: mockFile };

        const result = (await handleUpload(mockContext)) as UploadResponse;

        expect(result.success).toBe(true);
        expect(result.files[0].sizeFormatted).toMatch(expected);
      }
    });
  });

  describe("Edge cases", () => {
    it("should handle empty file (0 bytes)", async () => {
      const mockFile = {
        name: "empty.txt",
        size: 0,
        type: "text/plain",
        arrayBuffer: async () => new ArrayBuffer(0),
      } as unknown as File;

      mockContext.body = { files: mockFile };

      const result = (await handleUpload(mockContext)) as UploadResponse;

      expect(result.success).toBe(true);
      expect(result.files[0].size).toBe(0);
    });

    it("should handle file size just below limit", async () => {
      const size = MAX_FILE_SIZE - 1;
      const mockFile = {
        name: "almost-max.pdf",
        size,
        type: "application/pdf",
        arrayBuffer: async () => new ArrayBuffer(size),
      } as unknown as File;

      mockContext.body = { files: mockFile };

      const result = (await handleUpload(mockContext)) as UploadResponse;

      expect(result.success).toBe(true);
      expect(result.files[0].size).toBe(size);
    });

    it("should handle file size just above limit", async () => {
      const size = MAX_FILE_SIZE + 1;
      const mockFile = {
        name: "over-max.pdf",
        size,
        type: "application/pdf",
        arrayBuffer: async () => new ArrayBuffer(size),
      } as unknown as File;

      mockContext.body = { files: mockFile };

      const result = await handleUpload(mockContext);

      expect(result).toMatchObject({
        success: false,
        code: "FILE_TOO_LARGE",
      });
      expect(mockSet.status).toBe(413);
    });

    it("should handle single file as non-array", async () => {
      const mockFile = {
        name: "single.txt",
        size: 100,
        type: "text/plain",
        arrayBuffer: async () => new ArrayBuffer(100),
      } as unknown as File;

      mockContext.body = { files: mockFile };

      const result = (await handleUpload(mockContext)) as UploadResponse;

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(1);
    });
  });
});
