import FileCards from "./FileCards";
import { useIsMobile } from "../utils/use-mobile";
import type { FileData } from "../App";
import { FileTable } from "./FileTable";

type FilesProps = {
  files: FileData[];
  onDelete: (id: string) => void;
  onDownload: (file: FileData) => void;
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
