import { t, type Context } from "elysia";
import { readdirSync, statSync } from "fs";
import { join } from "path";
import type { ListFilesResponse, ErrorResponse } from "../types";
import {
  formatFileSize,
  extractUUID,
  getOriginalName,
  extractText,
  getExtension,
} from "../utils/fileUtils";
import {
  UPLOAD_DIR,
  SEARCHABLE_EXTENSIONS,
  DEFAULT_LIMIT,
  DEFAULT_OFFSET,
} from "../config/constants";

interface ListFilesQuery {
  textSearch?: string;
  content?: boolean;
  limit?: number;
  offset?: number;
}

export async function handleListFiles({
  query,
  set,
}: {
  query: ListFilesQuery;
  set: Context["set"];
}): Promise<ListFilesResponse | ErrorResponse> {
  try {
    const {
      textSearch = "",
      content = false,
      limit = DEFAULT_LIMIT,
      offset = DEFAULT_OFFSET,
    } = query;
    const hasFilters = (textSearch && textSearch.trim() !== "") || content;
    let totalSize = 0;

    const allFiles = readdirSync(UPLOAD_DIR);
    const totalFiles = allFiles.length;
    const filesWithMetadata = allFiles
      .map((filename) => {
        const filePath = join(UPLOAD_DIR, filename);
        const stats = statSync(filePath);
        const extension = getExtension(filename);
        const id = extractUUID(filename);
        const nameWithoutExt = getOriginalName(filename);

        totalSize += stats.size;

        return {
          id,
          name: nameWithoutExt,
          displayName: nameWithoutExt + `.${extension}`,
          size: stats.size,
          sizeFormatted: formatFileSize(stats.size),
          createdAt: stats.birthtime.toISOString(),
          extension,
          filePath,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    let filteredFiles = filesWithMetadata;
    if (content) {
      filteredFiles = filteredFiles.filter((file) =>
        SEARCHABLE_EXTENSIONS.includes(file.extension.toLowerCase())
      );

      if (textSearch && textSearch.trim() !== "") {
        const searchTerm = textSearch.toLowerCase();

        const filesWithContent = await Promise.all(
          filteredFiles.map(async (file) => {
            const content = await extractText(file.filePath);
            return {
              file,
              content: content.toLowerCase(),
            };
          })
        );

        filteredFiles = filesWithContent
          .filter(({ content }) => content.includes(searchTerm))
          .map(({ file }) => file);
      }
    } else if (hasFilters) {
      const searchTerm = textSearch.toLowerCase();
      filteredFiles = filteredFiles.filter((file) =>
        file.name.toLowerCase().includes(searchTerm)
      );
    }

    let filteredCount = null,
      filteredSize = null;
    if (hasFilters) {
      filteredCount = filteredFiles.length;
      filteredSize = filteredFiles.reduce((sum, file) => sum + file.size, 0);
    }

    const paginatedFiles = filteredFiles.slice(offset, offset + limit);

    return {
      success: true,
      files: paginatedFiles.map(({ filePath, ...item }) => ({
        ...item,
        url: `/api/files/${item.name}${item.id}.${item.extension}`,
      })),
      metadata: {
        total: totalFiles,
        totalSize,
        totalSizeFormatted: formatFileSize(totalSize),
        filteredFiles: filteredCount,
        filteredSize,
        filteredSizeFormatted:
          filteredSize !== null ? formatFileSize(filteredSize) : null,
        limit,
        offset,
      },
    };
  } catch (error) {
    console.error("List files error:", error);
    set.status = 500;
    return {
      success: false,
      error: "Failed to list files",
      code: "LIST_ERROR",
    } as ErrorResponse;
  }
}

export const handleListFilesDocumentation = {
  query: t.Object({
    textSearch: t.Optional(
      t.String({
        description: "Search term for filename or content",
      })
    ),
    content: t.Optional(
      t.Boolean({
        description:
          "If true, search only in file contents and filter by searchable types",
      })
    ),
    limit: t.Optional(
      t.Number({
        description: "Number of files to return per page",
        default: DEFAULT_LIMIT,
      })
    ),
    offset: t.Optional(
      t.Number({
        description: "Number of files to skip",
        default: DEFAULT_OFFSET,
      })
    ),
  }),
  detail: {
    summary: "List uploaded files",
    tags: ["files", "list"],
  },
  response: {
    200: t.Object({
      success: t.Boolean(),
      files: t.Array(
        t.Object({
          id: t.String(),
          name: t.String(),
          displayName: t.String(),
          size: t.Number(),
          sizeFormatted: t.String(),
          createdAt: t.String(),
          extension: t.String(),
          url: t.String(),
        })
      ),
      metadata: t.Object({
        total: t.Number(),
        totalSize: t.Number(),
        totalSizeFormatted: t.String(),
        filteredFiles: t.Nullable(t.Number()),
        filteredSize: t.Nullable(t.Number()),
        filteredSizeFormatted: t.Nullable(t.String()),
        limit: t.Number(),
        offset: t.Number(),
      }),
    }),
    500: t.Object({
      success: t.Literal(false),
      error: t.String(),
      code: t.String(),
    }),
  },
};
