import { describe, it, expect } from "bun:test";
import { writeFileSync, rmSync } from "fs";
import { join } from "path";
import { UPLOAD_DIR } from "../config/constants";
import { testApp } from "../../preload";

describe("GET /api/files/:id", () => {
  it("should download a file successfully", async () => {
    const testFileId = "0542f4c4-192b-4eaa-9857-91e276088878";
    const testFilename = `report${testFileId}.pdf`;
    const testContent = "This is a test PDF content";
    const testFilePath = join(UPLOAD_DIR, testFilename);

    writeFileSync(testFilePath, testContent);

    const response = await testApp.handle(
      new Request(`http://localhost/api/files/${testFileId}`)
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toContain("report.pdf");

    const content = await response.text();
    expect(content).toBe(testContent);

    rmSync(testFilePath, { force: true });
  });

  it("should return 404 for non-existent file", async () => {
    const fakeId = "00000000-0000-0000-0000-000000000000";
    const response = await testApp.handle(
      new Request(`http://localhost/api/files/${fakeId}`)
    );

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe("File not found");
    expect(data.code).toBe("FILE_NOT_FOUND");
  });

  it("should return 400 for invalid UUID format", async () => {
    const invalidId = "invalid-uuid";
    const response = await testApp.handle(
      new Request(`http://localhost/api/files/${invalidId}`)
    );

    // Elysia returns 422 for validation errors (schema validation)
    expect(response.status).toBe(422);
  });

  it("should return correct MIME type for different file types", async () => {
    const txtId = "1234f4c4-192b-4eaa-9857-91e276088878";
    const txtFilename = `test${txtId}.txt`;
    const txtFilePath = join(UPLOAD_DIR, txtFilename);

    writeFileSync(txtFilePath, "Text content");

    const txtResponse = await testApp.handle(
      new Request(`http://localhost/api/files/${txtId}`)
    );
    expect(txtResponse.status).toBe(200);
    expect(txtResponse.headers.get("Content-Type")).toContain("text/plain");

    rmSync(txtFilePath, { force: true });
  });

  it("should return correct content size", async () => {
    const testFileId = "0542f4c4-192b-4eaa-9857-91e276088878";
    const testFilename = `report${testFileId}.pdf`;
    const testContent = "This is a test PDF content";
    const testFilePath = join(UPLOAD_DIR, testFilename);

    writeFileSync(testFilePath, testContent);

    const response = await testApp.handle(
      new Request(`http://localhost/api/files/${testFileId}`)
    );

    expect(response.status).toBe(200);
    
    // Verify content size through the actual content
    const content = await response.text();
    expect(content.length).toBe(testContent.length);
    expect(content).toBe(testContent);

    rmSync(testFilePath, { force: true });
  });
});
