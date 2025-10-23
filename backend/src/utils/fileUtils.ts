import { v4 as uuidv4 } from "uuid";
import { readFileSync } from "fs";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

export function formatFileSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

export function generateUniqueFilename(originalName: string): {
  id: string;
  filename: string;
} {
  const id = uuidv4();

  if (!originalName || originalName.trim() === "")
    return { id, filename: `file_${id}` };

  const lastDotIndex = originalName.lastIndexOf(".");

  if (lastDotIndex === -1) {
    const filename = `${originalName}${id}`;
    return { id, filename };
  }
  const nameWithoutExt = originalName.substring(0, lastDotIndex);
  const ext = originalName.substring(lastDotIndex);
  const filename = `${nameWithoutExt}${id}${ext}`;

  return { id, filename };
}

export function extractUUID(filename: string): string {
  const lastDotIndex = filename.lastIndexOf(".");
  const nameWithoutExt =
    lastDotIndex === -1 ? filename : filename.substring(0, lastDotIndex);
  return nameWithoutExt.slice(-36);
}

export function getOriginalName(filename: string): string {
  if (filename.length < 36)
    throw new Error("Filename is too short to contain a UUID.");
  const lastDotIndex = filename.lastIndexOf(".");
  if (lastDotIndex === -1) return filename.slice(0, -36);

  const nameWithoutExt = filename.substring(0, lastDotIndex);
  return nameWithoutExt.slice(0, -36);
}

export function getExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf(".");
  if (lastDotIndex === -1) return "";
  return filename.substring(lastDotIndex + 1);
}

export async function extractText(filePath: string): Promise<string> {
  const extension = getExtension(filePath);
  try {
    switch (extension.toLowerCase()) {
      case "pdf": {
        const parser = new PDFParse({ url: `file://${filePath}` });
        const result = await parser.getText();
        return result.text;
      }
      case "docx": {
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;
      }
      case "txt":
      case "md": {
        return readFileSync(filePath, "utf-8");
      }
      default:
        return "";
    }
  } catch (error) {
    console.error(`Error extracting text from ${filePath}:`, error);
    return "";
  }
}
