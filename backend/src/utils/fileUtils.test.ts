import { afterAll, describe, expect, it, mock } from "bun:test";
import {
  formatFileSize,
  generateUniqueFilename,
  extractUUID,
  getOriginalName,
  getExtension,
  extractText,
} from "./fileUtils";
import { writeFile } from "fs/promises";
import { join } from "path";

const TEST_UPLOAD_DIR = join(process.cwd(), "test_uploads");
async function createTestFile(filename: string, content: string) {
  await writeFile(join(TEST_UPLOAD_DIR, filename), content);
}

mock.module("uuid", () => ({
  v4: mock(() => "12345677-1234-1234-1234-1234567890ab"),
}));

mock.module("pdf-parse", () => ({
  PDFParse: mock().mockImplementation((options: any) => ({
    getText: mock(() => {
      if (options.url.includes("error")) {
        return Promise.reject(new Error("Mocked PDF parsing error"));
      }
      return Promise.resolve({ text: "Mocked PDF text content" });
    }),
  })),
}));

mock.module("mammoth", () => ({
  default: {
    extractRawText: mock(({ path }: { path: string }) => {
      if (path.includes("error")) {
        return Promise.reject(new Error("Mocked DOCX parsing error"));
      }
      return Promise.resolve({ value: "Mocked DOCX text content" });
    }),
  },
}));

describe("fileUtils", () => {
  afterAll(() => {
    mock.restore();
  });

  describe("formatFileSize", () => {
    it("should format bytes correctly", () => {
      expect(formatFileSize(0)).toBe("0.00 B");
      expect(formatFileSize(100)).toBe("100.00 B");
      expect(formatFileSize(1023)).toBe("1023.00 B");
    });

    it("should format kilobytes correctly", () => {
      expect(formatFileSize(1024)).toBe("1.00 KB");
      expect(formatFileSize(1536)).toBe("1.50 KB");
      expect(formatFileSize(10240)).toBe("10.00 KB");
      expect(formatFileSize(1024 * 500)).toBe("500.00 KB");
    });

    it("should format megabytes correctly", () => {
      expect(formatFileSize(1024 * 1024)).toBe("1.00 MB");
      expect(formatFileSize(1024 * 1024 * 2.5)).toBe("2.50 MB");
      expect(formatFileSize(1024 * 1024 * 10)).toBe("10.00 MB");
      expect(formatFileSize(1024 * 1024 * 999)).toBe("999.00 MB");
    });

    it("should format gigabytes correctly", () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe("1.00 GB");
      expect(formatFileSize(1024 * 1024 * 1024 * 5.25)).toBe("5.25 GB");
      expect(formatFileSize(1024 * 1024 * 1024 * 100)).toBe("100.00 GB");
    });

    it("should handle edge cases", () => {
      expect(formatFileSize(1)).toBe("1.00 B");
      expect(formatFileSize(1024 * 1024 * 1024 * 1024)).toBe("1024.00 GB");
    });

    it("should handle decimal values correctly", () => {
      expect(formatFileSize(1536.789)).toBe("1.50 KB");
      expect(formatFileSize(1024 * 1024 * 1.999)).toMatch(/2\.\d{2} MB/);
    });

    it("should handle negative numbers (This won't happen, ofc)", () => {
      expect(formatFileSize(-1024)).toBe("-1024.00 B");
      expect(formatFileSize(-1)).toBe("-1.00 B");
      expect(formatFileSize(-1048576)).toBe("-1048576.00 B"); // negative numbers don't convert to KB/MB in current implementation
    });

    it("should handle very large numbers", () => {
      const largeNumber = 1024 * 1024 * 1024 * 1024 * 10;
      expect(formatFileSize(largeNumber)).toBe("10240.00 GB");
    });

    it("should handle zero correctly", () => {
      expect(formatFileSize(0)).toBe("0.00 B");
    });

    it("should handle fractional bytes", () => {
      expect(formatFileSize(0.5)).toBe("0.50 B");
      expect(formatFileSize(0.99)).toBe("0.99 B");
    });
  });

  describe("generateUniqueFilename", () => {
    it("should generate unique id and filename using mocked uuid", () => {
      const result = generateUniqueFilename("test.txt");

      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("filename");
      expect(result.id).toBe("12345677-1234-1234-1234-1234567890ab");
      expect(result.filename).toBe(
        "test12345677-1234-1234-1234-1234567890ab.txt"
      );
    });

    it("should preserve file extension with mocked uuid", () => {
      const result = generateUniqueFilename("document.pdf");

      expect(result.filename).toBe(
        "document12345677-1234-1234-1234-1234567890ab.pdf"
      );
      expect(result.id).toBe("12345677-1234-1234-1234-1234567890ab");
    });

    it("should include original filename without extension", () => {
      const result = generateUniqueFilename("myDocument.docx");

      expect(result.filename).toBe(
        "myDocument12345677-1234-1234-1234-1234567890ab.docx"
      );
      expect(result.id).toBe("12345677-1234-1234-1234-1234567890ab");
    });

    it("should handle files with multiple dots", () => {
      const result = generateUniqueFilename("my.file.name.txt");

      expect(result.filename).toBe(
        "my.file.name12345677-1234-1234-1234-1234567890ab.txt"
      );
      expect(result.id).toBe("12345677-1234-1234-1234-1234567890ab");
    });

    it("should handle files without extension", () => {
      const result = generateUniqueFilename("README");

      expect(result.filename).toBe(
        "README12345677-1234-1234-1234-1234567890ab"
      );
      expect(result.id).toBe("12345677-1234-1234-1234-1234567890ab");
    });

    it("should generate consistent uuid for all calls", () => {
      const result1 = generateUniqueFilename("test.txt");
      const result2 = generateUniqueFilename("test.txt");
      const result3 = generateUniqueFilename("test.txt");

      expect(result1.id).toBe("12345677-1234-1234-1234-1234567890ab");
      expect(result2.id).toBe("12345677-1234-1234-1234-1234567890ab");
      expect(result3.id).toBe("12345677-1234-1234-1234-1234567890ab");

      expect(result1.filename).toBe(
        "test12345677-1234-1234-1234-1234567890ab.txt"
      );
      expect(result2.filename).toBe(
        "test12345677-1234-1234-1234-1234567890ab.txt"
      );
      expect(result3.filename).toBe(
        "test12345677-1234-1234-1234-1234567890ab.txt"
      );
    });

    it("should handle long filenames with mocked uuid", () => {
      const longName = "a".repeat(200) + ".txt";
      const result = generateUniqueFilename(longName);

      expect(result.filename).toBe(
        "a".repeat(200) + "12345677-1234-1234-1234-1234567890ab.txt"
      );
      expect(result.id).toBe("12345677-1234-1234-1234-1234567890ab");
    });

    it("should handle special characters in filename", () => {
      const result = generateUniqueFilename("file with spaces.txt");

      expect(result.id).toBe("12345677-1234-1234-1234-1234567890ab");
      expect(result.filename).toBe(
        "file with spaces12345677-1234-1234-1234-1234567890ab.txt"
      );
    });

    it("should return mocked UUID in expected format", () => {
      const result = generateUniqueFilename("test.txt");

      expect(result.id).toBe("12345677-1234-1234-1234-1234567890ab");
    });

    it("should handle empty string filename", () => {
      const result = generateUniqueFilename("");

      expect(result.id).toBe("12345677-1234-1234-1234-1234567890ab");
      expect(result.filename).toBe("file_12345677-1234-1234-1234-1234567890ab");
    });

    it("should handle whitespace-only filename", () => {
      const result = generateUniqueFilename("   ");

      expect(result.id).toBe("12345677-1234-1234-1234-1234567890ab");
      expect(result.filename).toBe("file_12345677-1234-1234-1234-1234567890ab");
    });

    it("should handle null or undefined filename", () => {
      const result1 = generateUniqueFilename(null as any);
      const result2 = generateUniqueFilename(undefined as any);

      expect(result1.filename).toBe(
        "file_12345677-1234-1234-1234-1234567890ab"
      );
      expect(result2.filename).toBe(
        "file_12345677-1234-1234-1234-1234567890ab"
      );
    });
  });

  describe("extractUUID", () => {
    it("should extract UUID from filename with extension", () => {
      const uuid = "0542f4c4-192b-4eaa-9857-91e276088878";
      const filename = `report${uuid}.pdf`;

      expect(extractUUID(filename)).toBe(uuid);
    });

    it("should extract UUID from various file types", () => {
      const uuid = "abc12345-1234-4abc-8abc-123456789abc";

      expect(extractUUID(`file${uuid}.txt`)).toBe(uuid);
      expect(extractUUID(`doc${uuid}.docx`)).toBe(uuid);
      expect(extractUUID(`presentation${uuid}.md`)).toBe(uuid);
    });

    it("should handle filename without prefix", () => {
      const uuid = "12345678-1234-4123-8123-123456789012";
      const filename = `${uuid}.pdf`;

      expect(extractUUID(filename)).toBe(uuid);
    });

    it("should extract last 36 characters before extension", () => {
      const uuid = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
      const filename = `very-long-filename-with-dashes${uuid}.txt`;

      expect(extractUUID(filename)).toBe(uuid);
    });

    it("should extract UUID from filename without extension", () => {
      const uuid = "0542f4c4-192b-4eaa-9857-91e276088878";
      const filename = `README${uuid}`;

      expect(extractUUID(filename)).toBe(uuid);
    });

    it("should handle files without extension and no prefix", () => {
      const uuid = "abc12345-1234-4abc-8abc-123456789abc";
      const filename = uuid;

      expect(extractUUID(filename)).toBe(uuid);
    });

    it("should extract UUID from various files without extension", () => {
      const uuid = "12345678-1234-4123-8123-123456789012";

      expect(extractUUID(`LICENSE${uuid}`)).toBe(uuid);
      expect(extractUUID(`Makefile${uuid}`)).toBe(uuid);
      expect(extractUUID(`Dockerfile${uuid}`)).toBe(uuid);
    });

    it("should handle empty filename", () => {
      expect(extractUUID("")).toBe("");
    });

    it("should handle filename with only extension", () => {
      expect(extractUUID(".txt")).toBe("");
    });

    it("should handle very long UUID-like strings", () => {
      const longString =
        "prefix-12345678-1234-4567-8901-123456789012-suffix.txt";
      expect(extractUUID(longString)).toBe(
        "8-1234-4567-8901-123456789012-suffix"
      );
    });
  });

  describe("getOriginalName", () => {
    it("should remove UUID and keep original name", () => {
      const uuid = "0542f4c4-192b-4eaa-9857-91e276088878";
      const filename = `report${uuid}.pdf`;

      expect(getOriginalName(filename)).toBe("report");
    });

    it("should work with different file extensions", () => {
      const uuid = "abc12345-1234-4abc-8abc-123456789abc";

      expect(getOriginalName(`notes${uuid}.md`)).toBe("notes");
      expect(getOriginalName(`document${uuid}.txt`)).toBe("document");
      expect(getOriginalName(`file${uuid}.docx`)).toBe("file");
    });

    it("should handle filenames with multiple words", () => {
      const uuid = "12345678-1234-4123-8123-123456789012";
      const filename = `my-important-file${uuid}.pdf`;

      expect(getOriginalName(filename)).toBe("my-important-file");
    });

    it("should work with filename that has no prefix", () => {
      const uuid = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
      const filename = `${uuid}.txt`;

      expect(getOriginalName(filename)).toBe(""); // No name left after removing UUID
    });

    it("should return name without extension", () => {
      const uuid = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

      const extensions = [".pdf", ".txt", ".docx", ".md", ".json"];
      extensions.forEach((ext) => {
        const result = getOriginalName(`file${uuid}${ext}`);
        expect(result).toBe("file");
      });
    });

    it("should remove UUID from filename without extension", () => {
      const uuid = "0542f4c4-192b-4eaa-9857-91e276088878";
      const filename = `README${uuid}`;

      expect(getOriginalName(filename)).toBe("README");
    });

    it("should handle files without extension and no prefix", () => {
      const uuid = "abc12345-1234-4abc-8abc-123456789abc";
      const filename = uuid;

      expect(getOriginalName(filename)).toBe("");
    });

    it("should work with various files without extension", () => {
      const uuid = "12345678-1234-4123-8123-123456789012";

      expect(getOriginalName(`LICENSE${uuid}`)).toBe("LICENSE");
      expect(getOriginalName(`Makefile${uuid}`)).toBe("Makefile");
      expect(getOriginalName(`Dockerfile${uuid}`)).toBe("Dockerfile");
    });

    it("Should throw error for filenames shorter than 36 characters", () => {
      expect(() => getOriginalName("shortname.txt")).toThrow(
        "Filename is too short to contain a UUID."
      );
      expect(() =>
        getOriginalName("12345678901234567890123456789012345")
      ).toThrow("Filename is too short to contain a UUID.");
    });

    it("should handle filenames exactly 36 chars long", () => {
      const exactUuid = "12345678-1234-4567-8901-123456789012";
      expect(getOriginalName(exactUuid + ".txt")).toBe("");
      expect(getOriginalName(exactUuid)).toBe("");
    });

    it("should preserve dots in original filename", () => {
      const uuid = "12345678-1234-4567-8901-123456789012";
      const filename = `my.config.file${uuid}.json`;
      expect(getOriginalName(filename)).toBe("my.config.file");
    });
  });

  describe("getExtension", () => {
    it("should extract file extension correctly", () => {
      expect(getExtension("document.pdf")).toBe("pdf");
      expect(getExtension("file.txt")).toBe("txt");
      expect(getExtension("image.jpeg")).toBe("jpeg");
      expect(getExtension("archive.tar.gz")).toBe("gz");
    });

    it("should handle files with multiple dots", () => {
      expect(getExtension("my.file.name.txt")).toBe("txt");
      expect(getExtension("version.1.2.3.json")).toBe("json");
      expect(getExtension("backup.2024.01.01.sql")).toBe("sql");
    });

    it("should return empty string for files without extension", () => {
      expect(getExtension("README")).toBe("");
      expect(getExtension("LICENSE")).toBe("");
      expect(getExtension("Makefile")).toBe("");
      expect(getExtension("Dockerfile")).toBe("");
    });

    it("should handle files with dot at the end", () => {
      expect(getExtension("file.")).toBe("");
      expect(getExtension("document.")).toBe("");
    });

    it("should handle empty string", () => {
      expect(getExtension("")).toBe("");
    });

    it("should handle files with only dots", () => {
      expect(getExtension(".")).toBe("");
      expect(getExtension("..")).toBe("");
      expect(getExtension("...")).toBe("");
    });

    it("should handle hidden files with extension", () => {
      expect(getExtension(".gitignore")).toBe("gitignore");
      expect(getExtension(".env.local")).toBe("local");
      expect(getExtension(".bashrc")).toBe("bashrc");
    });

    it("should handle uppercase extensions", () => {
      expect(getExtension("document.PDF")).toBe("PDF");
      expect(getExtension("image.JPG")).toBe("JPG");
      expect(getExtension("text.TXT")).toBe("TXT");
    });

    it("should handle mixed case extensions", () => {
      expect(getExtension("document.Pdf")).toBe("Pdf");
      expect(getExtension("image.JpG")).toBe("JpG");
      expect(getExtension("text.TxT")).toBe("TxT");
    });

    it("should handle numeric extensions", () => {
      expect(getExtension("file.123")).toBe("123");
      expect(getExtension("backup.2024")).toBe("2024");
    });

    it("should handle single character extensions", () => {
      expect(getExtension("file.c")).toBe("c");
      expect(getExtension("script.r")).toBe("r");
    });

    it("should handle very long extensions", () => {
      const longExt = "verylongextension";
      expect(getExtension(`file.${longExt}`)).toBe(longExt);
    });

    it("should handle filenames with spaces", () => {
      expect(getExtension("my file.txt")).toBe("txt");
      expect(getExtension("file with spaces.pdf")).toBe("pdf");
    });
  });

  describe("extractText", () => {
    it("should extract text from PDF files using mocked PDFParse", async () => {
      const result = await extractText("/path/to/file.pdf");

      expect(result).toBe("Mocked PDF text content");
    });

    it("should extract text from DOCX files using mocked mammoth", async () => {
      const result = await extractText("/path/to/file.docx");

      expect(result).toBe("Mocked DOCX text content");
    });

    it("should extract text from TXT files using mocked readFileSync", async () => {
      await createTestFile(
        "fileaaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.txt",
        "Mocked text content from txt file"
      );
      const result = await extractText(
        join(TEST_UPLOAD_DIR, "fileaaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.txt")
      );

      expect(result).toBe("Mocked text content from txt file");
    });

    it("should extract text from MD files using mocked readFileSync", async () => {
      await createTestFile(
        "fileaaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.md",
        "Mocked text content from md file"
      );
      const result = await extractText(
        join(TEST_UPLOAD_DIR, "fileaaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.md")
      );

      expect(result).toBe("Mocked text content from md file");
    });

    it("should handle case insensitive extensions for txt", async () => {
      await createTestFile(
        "fileaaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.TXT",
        "Mocked text content from TXT file"
      );
      const result = await extractText(
        join(TEST_UPLOAD_DIR, "fileaaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.TXT")
      );

      expect(result).toBe("Mocked text content from TXT file");
    });

    it("should handle case insensitive extensions for pdf", async () => {
      const result = await extractText("/path/to/file.PDF");

      expect(result).toBe("Mocked PDF text content");
    });

    it("should handle case insensitive extensions for docx", async () => {
      const result = await extractText("/path/to/file.DOCX");

      expect(result).toBe("Mocked DOCX text content");
    });

    it("should return empty string for unsupported file types", async () => {
      const result = await extractText("/path/to/file.xyz");

      expect(result).toBe("");
    });

    it("should handle PDF extraction errors gracefully", async () => {
      const originalConsoleError = console.error;
      const consoleErrorSpy = mock(() => {});
      console.error = consoleErrorSpy;

      const result = await extractText("/path/to/error.pdf");

      expect(result).toBe("");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error extracting text from /path/to/error.pdf:",
        expect.any(Error)
      );

      console.error = originalConsoleError;
    });

    it("should handle DOCX extraction errors gracefully", async () => {
      const originalConsoleError = console.error;
      const consoleErrorSpy = mock(() => {});
      console.error = consoleErrorSpy;

      const result = await extractText("/path/to/error.docx");

      expect(result).toBe("");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error extracting text from /path/to/error.docx:",
        expect.any(Error)
      );

      console.error = originalConsoleError;
    });

    it("should handle TXT file read errors gracefully", async () => {
      const originalConsoleError = console.error;
      const consoleErrorSpy = mock(() => {});
      console.error = consoleErrorSpy;

      const result = await extractText("/path/to/error.txt");

      expect(result).toBe("");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error extracting text from /path/to/error.txt:",
        expect.any(Error)
      );

      console.error = originalConsoleError;
    });

    it("should handle MD file read errors gracefully", async () => {
      const originalConsoleError = console.error;
      const consoleErrorSpy = mock(() => {});
      console.error = consoleErrorSpy;

      const result = await extractText("/path/to/error.md");

      expect(result).toBe("");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error extracting text from /path/to/error.md:",
        expect.any(Error)
      );

      console.error = originalConsoleError;
    });

    it("should handle empty extension", async () => {
      const result = await extractText("/path/to/file");

      expect(result).toBe("");
    });
  });
});
