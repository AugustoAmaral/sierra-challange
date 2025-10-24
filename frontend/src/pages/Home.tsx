import { useState, useRef, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import Files from "../components/Files";
import getFiles from "../queries/getFiles";
import uploadFile from "../queries/uploadFile";
import deleteFile from "../queries/deleteFile";
import getFile from "../queries/getFile";
import LoadingWrapper from "../components/LoadingWrapper";
import Footer from "../components/Footer";
import EmptyDataHandler from "../components/EmptyDataHandler";
import useDebounce from "../utils/useDebounce";
import UploadProgress from "../components/ui/UploadProgress";
import SearchBar from "../components/SearchBar";

type QueryData = NonNullable<Awaited<ReturnType<typeof getFiles>>>;
type FileData = NonNullable<QueryData["files"]>;
type Metadata = QueryData["metadata"];

type FileUploadProgress = {
  name: string;
  progress: number;
  status: "uploading" | "completed" | "error";
};

function Home() {
  const [files, setFiles] = useState<FileData>([]);
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [contentSearch, setContentSearch] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress[]>(
    []
  );
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 250);
  const debouncedContentSearch = useDebounce(contentSearch, 250);

  const handleUpload = async (uploadedFiles: File[]) => {
    setIsUploading(true);

    // Inicializa o progresso para cada arquivo
    const initialProgress: FileUploadProgress[] = uploadedFiles.map((file) => ({
      name: file.name,
      progress: 0,
      status: "uploading" as const,
    }));
    setUploadProgress(initialProgress);

    try {
      // Faz upload de cada arquivo individualmente
      const uploadPromises = uploadedFiles.map(async (file, index) => {
        try {
          const response = await uploadFile(file, {
            onProgress: (progress) => {
              setUploadProgress((prev) => {
                const newProgress = [...prev];
                newProgress[index] = {
                  ...newProgress[index],
                  progress: progress.percentage,
                };
                return newProgress;
              });
            },
          });

          // Marca como concluído
          setUploadProgress((prev) => {
            const newProgress = [...prev];
            newProgress[index] = {
              ...newProgress[index],
              progress: 100,
              status: "completed",
            };
            return newProgress;
          });

          return response;
        } catch (error) {
          // Marca como erro
          setUploadProgress((prev) => {
            const newProgress = [...prev];
            newProgress[index] = {
              ...newProgress[index],
              status: "error",
            };
            return newProgress;
          });
          throw error;
        }
      });

      const results = await Promise.allSettled(uploadPromises);
      const successCount = results.filter(
        (r) => r.status === "fulfilled"
      ).length;
      const failureCount = results.filter(
        (r) => r.status === "rejected"
      ).length;

      if (successCount > 0) {
        setIsLoading(true);
        getFiles(searchTerm, contentSearch)
          .then((data) => {
            if (data.files) setFiles(data.files);
            if (data.metadata) setMetadata(data.metadata);

            if (failureCount === 0) {
              toast.success(
                `${successCount} arquivo(s) enviado(s) com sucesso!`
              );
            } else {
              toast.warning(
                `${successCount} arquivo(s) enviado(s) com sucesso, ${failureCount} falharam`
              );
            }
          })
          .catch(() => {
            toast.error("Erro ao atualizar a lista de arquivos");
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else {
        toast.error("Erro ao fazer upload dos arquivos");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erro ao fazer upload dos arquivos");
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress([]);
      }, 2000);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles) return;

    await handleUpload(Array.from(uploadedFiles));

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      await handleUpload(droppedFiles);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteFile(id);
      setFiles(files?.filter((file) => file.id !== id));
      toast.success("Arquivo deletado com sucesso!");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Erro ao deletar arquivo");
    }
  };

  // Effect for loading the data when search terms change
  useEffect(() => {
    setIsLoading(true);
    getFiles(debouncedSearchTerm, debouncedContentSearch)
      .then((data) => {
        if (data.files) setFiles(data.files);
        if (data.metadata) setMetadata(data.metadata);
      })
      .catch(() => {
        toast.error("Erro ao atualizar a lista de arquivos");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [debouncedSearchTerm, debouncedContentSearch]);

  // Global drag events to allow dropping files anywhere
  useEffect(() => {
    const handleGlobalDragOver = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    };

    const handleGlobalDrop = (e: DragEvent) => {
      e.preventDefault();
    };

    window.addEventListener("dragover", handleGlobalDragOver);
    window.addEventListener("drop", handleGlobalDrop);

    return () => {
      window.removeEventListener("dragover", handleGlobalDragOver);
      window.removeEventListener("drop", handleGlobalDrop);
    };
  }, []);

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8 relative"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {isDragging && (
        <div className="fixed inset-0 bg-blue-500/10 border-4 border-dashed border-blue-500 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-blue-500">
            <Upload className="h-16 w-16 text-blue-500 mx-auto mb-4" />
            <p className="text-blue-600">Solte os arquivos para fazer upload</p>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="mb-2">Gerenciador de Arquivos</h1>
          <p className="text-slate-600">
            Faça upload, busque e gerencie seus arquivos
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex gap-4 mb-6">
            <SearchBar
              searchTerm={searchTerm}
              onChangeSearchTerm={setSearchTerm}
              contentSearch={contentSearch}
              onChangeContentSearch={setContentSearch}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="gap-2 self-start"
            >
              <Upload className="h-4 w-4" />
              Upload
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
          <UploadProgress
            isUploading={isUploading}
            uploadProgress={uploadProgress}
          />
          <LoadingWrapper isLoading={isLoading}>
            <EmptyDataHandler
              filesLength={files.length}
              isFilterApplied={contentSearch}
            >
              <Files
                files={files}
                onDelete={handleDelete}
                onDownload={getFile}
              />
            </EmptyDataHandler>
          </LoadingWrapper>
        </div>
        <Footer
          filesLength={metadata?.total}
          filteredSize={metadata?.filteredSizeFormatted}
          totalSize={metadata?.totalSizeFormatted}
        />
      </div>
    </div>
  );
}

export default Home;
