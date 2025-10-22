import { join } from "path";

// export const FILE_TYPES = {
//   pdf: "application/pdf",
//   docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
//   txt: "text/plain",
//   md: "text/markdown",
// } as const;

export const UPLOAD_DIR = join(process.cwd(), "files");
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_FILES = 10;
export const API_PORT = 3000;
// export const SUPPORTED_FILE_EXTENSIONS = Object.keys(FILE_TYPES);
// export const SUPPORTED_FILE_TYPES = Object.values(FILE_TYPES);
