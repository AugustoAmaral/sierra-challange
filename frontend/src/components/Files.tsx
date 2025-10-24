import FileCards from "./FileCards";
import { useIsMobile } from "../utils/use-mobile";
import { FileTable } from "./FileTable";
import type getFiles from "../queries/getFiles";

type FileData = NonNullable<Awaited<ReturnType<typeof getFiles>>["files"]>;
type FilesProps = {
  files: FileData;
  onDelete: (id: string) => void;
  onDownload: (id: string) => void;
};

function Files({ files, onDelete, onDownload }: FilesProps) {
  const isMobile = useIsMobile();

  if (isMobile)
    return (
      <FileCards files={files} onDelete={onDelete} onDownload={onDownload} />
    );

  return (
    <FileTable files={files} onDelete={onDelete} onDownload={onDownload} />
  );
}

export default Files;
