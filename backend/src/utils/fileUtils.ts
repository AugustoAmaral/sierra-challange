import { v4 as uuidv4 } from "uuid";

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
  const lastDotIndex = originalName.lastIndexOf(".");
  const nameWithoutExt = originalName.substring(0, lastDotIndex);
  const ext = originalName.substring(lastDotIndex);
  const filename = `${nameWithoutExt}${id}${ext}`;

  return { id, filename };
}
