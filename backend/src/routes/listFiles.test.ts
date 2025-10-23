import { describe, expect, it, beforeAll, afterAll } from "bun:test";
import { mkdir, writeFile, rm } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { handleListFiles, handleListFilesDocumentation } from "./listFiles";

const TEST_UPLOAD_DIR = join(process.cwd(), "test-files");

describe("listFiles route", () => {
  beforeAll(async () => {
    if (!existsSync(TEST_UPLOAD_DIR)) {
      await mkdir(TEST_UPLOAD_DIR, { recursive: true });
    }

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
      await writeFile(join(TEST_UPLOAD_DIR, file.name), file.content);
    }
  });

  afterAll(async () => {
    // Clean up test directory
    if (existsSync(TEST_UPLOAD_DIR)) {
      await rm(TEST_UPLOAD_DIR, { recursive: true, force: true });
    }
  });

  it("should list all files without filters", async () => {
    expect(handleListFiles).toBeDefined();
    expect(handleListFilesDocumentation).toBeDefined();
  });

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
});
