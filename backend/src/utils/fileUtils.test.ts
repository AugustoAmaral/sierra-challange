import { describe, expect, it, beforeEach } from "bun:test";
import { formatFileSize, generateUniqueFilename } from "./fileUtils";

describe("fileUtils", () => {
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
  });

  describe("generateUniqueFilename", () => {
    it("should generate unique id and filename", () => {
      const result = generateUniqueFilename("test.txt");

      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("filename");
      expect(result.id).toBeTruthy();
      expect(result.filename).toBeTruthy();
    });

    it("should preserve file extension", () => {
      const extensions = [".txt", ".pdf", ".docx", ".md", ".json"];

      extensions.forEach((ext) => {
        const result = generateUniqueFilename(`test${ext}`);
        expect(result.filename).toEndWith(ext);
      });
    });

    it("should include original filename without extension", () => {
      const result = generateUniqueFilename("myDocument.pdf");
      expect(result.filename).toStartWith("myDocument");
      expect(result.filename).toEndWith(".pdf");
    });

    it("should handle files with multiple dots", () => {
      const result = generateUniqueFilename("my.file.name.txt");
      expect(result.filename).toStartWith("my.file.name");
      expect(result.filename).toEndWith(".txt");
    });

    it("should handle files without extension", () => {
      const result = generateUniqueFilename("README");
      expect(result.filename).toContain("README");
      expect(result.id).toBeTruthy();
      expect(result.filename).toMatch(/README[0-9a-f-]+$/i);
    });

    it("should generate different ids for multiple calls", () => {
      const result1 = generateUniqueFilename("test.txt");
      const result2 = generateUniqueFilename("test.txt");
      const result3 = generateUniqueFilename("test.txt");

      expect(result1.id).not.toBe(result2.id);
      expect(result2.id).not.toBe(result3.id);
      expect(result1.id).not.toBe(result3.id);

      expect(result1.filename).not.toBe(result2.filename);
      expect(result2.filename).not.toBe(result3.filename);
    });

    it("should handle long filenames", () => {
      const longName = "a".repeat(200) + ".txt";
      const result = generateUniqueFilename(longName);

      expect(result.filename).toBeTruthy();
      expect(result.filename).toEndWith(".txt");
      expect(result.id).toBeTruthy();
    });

    it("should handle special characters in filename", () => {
      const specialNames = [
        "file with spaces.txt",
        "file-with-dashes.pdf",
        "file_with_underscores.docx",
        "file(with)parentheses.md",
      ];

      specialNames.forEach((name) => {
        const result = generateUniqueFilename(name);
        expect(result.id).toBeTruthy();
        expect(result.filename).toBeTruthy();
        expect(result.filename !== name).toBeTruthy();
      });
    });

    it("should generate valid UUID v4 format", () => {
      const result = generateUniqueFilename("test.txt");
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      expect(result.id).toMatch(uuidRegex);
    });

    it("should handle empty string filename", () => {
      const result = generateUniqueFilename("");
      
      expect(result.id).toBeTruthy();
      expect(result.filename).toStartWith("file_");
      expect(result.filename).toContain(result.id);
    });

    it("should handle whitespace-only filename", () => {
      const result = generateUniqueFilename("   ");
      
      expect(result.id).toBeTruthy();
      expect(result.filename).toStartWith("file_");
      expect(result.filename).toBe(`file_${result.id}`);
    });
  });
});
