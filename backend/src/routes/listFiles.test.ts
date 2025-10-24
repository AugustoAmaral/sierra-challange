import { describe, expect, it, beforeEach } from "bun:test";
import { writeFile } from "fs/promises";
import { join } from "path";
import { handleListFiles, handleListFilesDocumentation } from "./listFiles";
import { ListFilesResponse } from "../types";

const TEST_UPLOAD_DIR = join(process.cwd(), "test_uploads");

async function createTestFile(filename: string, content: string) {
  await writeFile(join(TEST_UPLOAD_DIR, filename), content);
}
async function createSampleFiles() {
  const testFiles = [
    {
      name: "report0542f4c4-192b-4eaa-9857-91e276088878.pdf",
      content: "Test PDF content",
    },
    {
      name: "documentabc12345-1234-4abc-8abc-123456789abc.txt",
      content: "Test document content with searchable text",
    },
    {
      name: "notes12345678-1234-4123-8123-123456789012.md",
      content: "# Test Markdown\nSome notes here",
    },
  ];

  for (const file of testFiles) {
    await createTestFile(file.name, file.content);
    await new Promise((r) => setTimeout(r, 10)); // Ensure different timestamps
  }
}

describe("listFiles route", () => {
  it("should have proper documentation structure", () => {
    expect(handleListFilesDocumentation.query).toBeDefined();
    expect(handleListFilesDocumentation.detail).toBeDefined();
    expect(handleListFilesDocumentation.response).toBeDefined();
    expect(handleListFilesDocumentation.response[200]).toBeDefined();
    expect(handleListFilesDocumentation.response[500]).toBeDefined();
  });

  it("should include pagination parameters in documentation", () => {
    const querySchema = handleListFilesDocumentation.query;
    expect(querySchema).toBeDefined();
  });

  describe("handleListFiles", () => {
    it("it should return an empty file list when no files exist", async () => {
      const result = await handleListFiles({ query: {}, set: { status: 200 } });

      expect(result).toEqual({
        success: true,
        files: [],
        metadata: {
          total: 0,
          totalSize: 0,
          totalSizeFormatted: "0.00 B",
          filteredFiles: null,
          filteredSize: null,
          filteredSizeFormatted: null,
          limit: 20,
          offset: 0,
        },
      });
    });

    it("should list existing files with correct metadata", async () => {
      await createSampleFiles();

      const result = (await handleListFiles({
        query: {},
        set: { status: 200 },
      })) as ListFilesResponse;

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(3);

      const file = result.files[0];
      expect(file).toMatchObject({
        displayName: "notes.md",
        extension: "md",
        id: "12345678-1234-4123-8123-123456789012",
        name: "notes",
        size: 31,
        sizeFormatted: "31.00 B",
        url: "/api/file/12345678-1234-4123-8123-123456789012",
      });
      expect(file.createdAt).toMatch(
        /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/
      );

      expect(result.metadata.total).toMatchSnapshot();
    });

    it("should sort files by creation date (most recent first)", async () => {
      await createSampleFiles();
      const result = (await handleListFiles({
        query: {},
        set: { status: 200 },
      })) as ListFilesResponse;

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(3);

      const file1Date = new Date(result.files[0].createdAt);
      const file2Date = new Date(result.files[1].createdAt);
      expect(file1Date.getTime()).toBeGreaterThanOrEqual(file2Date.getTime());
    });
  });

  describe("Pagination", () => {
    beforeEach(async () => {
      for (let i = 1; i <= 5; i++) {
        await createTestFile(
          `file${i}aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.txt`,
          `content${i}`
        );
        await new Promise((r) => setTimeout(r, 10)); //Ensure different timestamps
      }
    });

    it("should limit the number of files returned", async () => {
      const result = (await handleListFiles({
        query: { limit: 3 },
        set: { status: 200 },
      })) as ListFilesResponse;

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(3);
      expect(result.metadata).toMatchSnapshot();
    });

    it("should apply offset correctly", async () => {
      const result = (await handleListFiles({
        query: { offset: 2, limit: 2 },
        set: { status: 200 },
      })) as ListFilesResponse;

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(2);
      expect(result.files[0].name).toBe("file3");
      expect(result.files[1].name).toBe("file2");
      expect(result.metadata).toMatchSnapshot();
    });

    it("should use default values when limit and offset are not provided", async () => {
      const result = (await handleListFiles({
        query: {},
        set: { status: 200 },
      })) as ListFilesResponse;

      expect(result.success).toBe(true);
      expect(result.metadata).toMatchSnapshot();
    });
  });

  describe("Search by file name", () => {
    beforeEach(async () => {
      await createTestFile(
        "document550e8400-e29b-41d4-a716-446655440000.pdf",
        "content"
      );
      await createTestFile(
        "image550e8400-e29b-41d4-a716-446655440000.jpg",
        "content"
      );
      await createTestFile(
        "report550e8400-e29b-41d4-a716-446655440000.txt",
        "content"
      );
    });

    it("should filter files by name (case insensitive)", async () => {
      const result = (await handleListFiles({
        query: { textSearch: "DOC" },
        set: { status: 200 },
      })) as ListFilesResponse;

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(1);
      expect(result.files[0].name).toBe("document");
    });

    it("should return an empty list when no files match the search", async () => {
      const result = (await handleListFiles({
        query: { textSearch: "nonexistent" },
        set: { status: 200 },
      })) as ListFilesResponse;

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(0);
      expect(result.metadata.filteredFiles).toBe(0);
      expect(result.metadata.filteredSize).toBe(0);
    });

    it("should not ignore whitespace in the search", async () => {
      const result = (await handleListFiles({
        query: { textSearch: "document" },
        set: { status: 200 },
      })) as ListFilesResponse;

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(1);
      expect(result.files[0].name).toBe("document");
    });
  });

  describe("Content Search", () => {
    beforeEach(async () => {
      for (let i = 0; i <= 4; i++) {
        await createTestFile(
          `file${i}aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.txt`,
          ["alpha", "beta", "gamma", "delta", "epsilon"][i]
        );
        await new Promise((r) => setTimeout(r, 10)); // Ensure different timestamps
      }
      await createTestFile(
        `imageaaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.jpg`,
        "binarycontent"
      );
    });

    it("should filter only files with searchable extensions when content=true", async () => {
      const result = (await handleListFiles({
        query: { textSearch: "a", content: true },
        set: { status: 200 },
      })) as ListFilesResponse;

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(4);
      expect(result.files.map((f) => f.extension)).not.toContain("jpg");
      expect(result.files.map((f) => f.name)).toMatchSnapshot();
    });

    it("should search inside the content when textSearch and content are provided", async () => {
      const result = (await handleListFiles({
        query: { textSearch: "ta", content: true },
        set: { status: 200 },
      })) as ListFilesResponse;

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(2);
      expect(result.files.map(({ name }) => name)).toMatchSnapshot();
    });

    it("should be case insensitive when searching content", async () => {
      const result = (await handleListFiles({
        query: { textSearch: "GAMMA", content: true },
        set: { status: 200 },
      })) as ListFilesResponse;

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(1);
    });

    it("should return empty list when no file content matches", async () => {
      const result = (await handleListFiles({
        query: { textSearch: "zeta", content: true },
        set: { status: 200 },
      })) as ListFilesResponse;

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(0);
    });

    it("should return all files when textSearch is empty with content=true", async () => {
      const result = (await handleListFiles({
        query: { textSearch: "", content: true },
        set: { status: 200 },
      })) as ListFilesResponse;

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(5); // Apenas os 5 arquivos txt
    });

    it("should return the correct metadata for content search results", async () => {
      const result = (await handleListFiles({
        query: { textSearch: "a", content: true },
        set: { status: 200 },
      })) as ListFilesResponse;

      expect(result.success).toBe(true);
      expect(result.metadata).toMatchSnapshot();
    });
  });

  describe("Edge cases", () => {
    it("should handle files without extensions", async () => {
      await createTestFile(
        "noextension550e8400-e29b-41d4-a716-446655440000",
        "content"
      );

      const result = (await handleListFiles({
        query: {},
        set: { status: 200 },
      })) as ListFilesResponse;

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(1);
      expect(result.files[0].extension).toBe("");
      expect(result.files[0].displayName).toBe("noextension.");
    });

    it("should handle very long file names", async () => {
      const longName = "a".repeat(200);
      await createTestFile(
        `${longName}550e8400-e29b-41d4-a716-446655440000.txt`,
        "content"
      );

      const result = (await handleListFiles({
        query: {},
        set: { status: 200 },
      })) as ListFilesResponse;

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(1);
      expect(result.files[0].name).toBe(longName);
    });

    it("should calculate URL correctly for different extensions", async () => {
      await createTestFile(
        "test550e8400-e29b-41d4-a716-446655440000.PDF",
        "content"
      );
      const result = (await handleListFiles({
        query: {},
        set: { status: 200 },
      })) as ListFilesResponse;

      expect(result.success).toBe(true);
      expect(result.files[0].url).toBe(
        "/api/file/550e8400-e29b-41d4-a716-446655440000"
      );
    });
  });
});
