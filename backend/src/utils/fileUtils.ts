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
