import { describe, it, expect } from "bun:test";
import { writeFileSync, existsSync } from "fs";
import { join } from "path";
import { UPLOAD_DIR } from "../config/constants";
import { testApp } from "../../preload";

const VALID_UUID = "0542f4c4-192b-4eaa-9857-91e276088878";
const INVALID_UUID = "invalid-uuid";

describe("DELETE /api/files/:id", () => {
  it("should delete a file successfully", async () => {
    const testFilename = `test${VALID_UUID}.txt`;
    const testFilePath = join(UPLOAD_DIR, testFilename);
    const testContent = "This is a test file for deletion";
    writeFileSync(testFilePath, testContent);

    const response = await testApp.handle(
      new Request(`http://localhost/api/files/${VALID_UUID}`, {
        method: "DELETE",
      })
    );

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data).toMatchObject({
      success: true,
      message: "File deleted successfully",
      deletedFile: {
        id: VALID_UUID,
        name: "test.txt",
        size: expect.any(Number),
        sizeFormatted: expect.any(String),
      },
    });

    expect(existsSync(testFilePath)).toBe(false);
  });

  it("should return 404 for non-existent file", async () => {
    const nonExistentUUID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

    const response = await testApp.handle(
      new Request(`http://localhost/api/files/${nonExistentUUID}`, {
        method: "DELETE",
      })
    );

    expect(response.status).toBe(404);
    const data = await response.json();

    expect(data).toMatchObject({
      success: false,
      error: "File not found",
      code: "FILE_NOT_FOUND",
    });
  });

  it("should return 400 for invalid UUID format", async () => {
    const response = await testApp.handle(
      new Request(`http://localhost/api/files/${INVALID_UUID}`, {
        method: "DELETE",
      })
    );

    expect(response.status).toBe(422);
  });

  it("should return 404 for empty UUID", async () => {
    const response = await testApp.handle(
      new Request("http://localhost/api/files/", {
        method: "DELETE",
      })
    );

    expect(response.status).toBe(404);
  });

  it("should handle file with different extensions", async () => {
    const pdfUUID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const testFilename = `document${pdfUUID}.pdf`;
    const testFilePath = join(UPLOAD_DIR, testFilename);
    writeFileSync(testFilePath, "PDF content");

    const response = await testApp.handle(
      new Request(`http://localhost/api/files/${pdfUUID}`, {
        method: "DELETE",
      })
    );

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.deletedFile.name).toBe("document.pdf");
    expect(existsSync(testFilePath)).toBe(false);
  });

  it("should handle file without extension", async () => {
    const noExtUUID = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    const testFilename = `testfile${noExtUUID}`;
    const testFilePath = join(UPLOAD_DIR, testFilename);
    writeFileSync(testFilePath, "No extension content");

    const response = await testApp.handle(
      new Request(`http://localhost/api/files/${noExtUUID}`, {
        method: "DELETE",
      })
    );

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.deletedFile.name).toBe("testfile.");
    expect(existsSync(testFilePath)).toBe(false);
  });

  it("should return correct file size information", async () => {
    const sizeTestUUID = "dddddddd-dddd-dddd-dddd-dddddddddddd";
    const testFilename = `sizefile${sizeTestUUID}.txt`;
    const testFilePath = join(UPLOAD_DIR, testFilename);
    const testContent = "A".repeat(1024); // 1KB
    writeFileSync(testFilePath, testContent);

    const response = await testApp.handle(
      new Request(`http://localhost/api/files/${sizeTestUUID}`, {
        method: "DELETE",
      })
    );

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.deletedFile.size).toBe(1024);
    expect(data.deletedFile.sizeFormatted).toContain("KB");
  });
});
