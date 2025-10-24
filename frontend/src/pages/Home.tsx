import { useState, useRef, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import { Progress } from "../components/ui/progress";
import { Search, Upload, Info } from "lucide-react";
import { toast } from "sonner";
import Files from "../components/Files";
import getFiles from "../queries/getFiles";
import uploadFile from "../queries/uploadFile";
import deleteFile from "../queries/deleteFile";
import getFile from "../queries/getFile";

type QueryData = NonNullable<Awaited<ReturnType<typeof getFiles>>>;
type FileData = NonNullable<QueryData["files"]>;
type Metadata = QueryData["metadata"];

function Home() {
  const [files, setFiles] = useState<FileData>([]);
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [contentSearch, setContentSearch] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsLoading(true);
    getFiles()
      .then((data) => {
        if (data.files) setFiles(data.files);
        if (data.metadata) setMetadata(data.metadata);
      })
      .catch(() => {
        toast.error("Erro ao buscar arquivos");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleUpload = async (uploadedFiles: File[]) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const response = await uploadFile(uploadedFiles);
      setUploadProgress(100);

      if (response.data?.success) {
        setIsLoading(true);
        getFiles(searchTerm, contentSearch)
          .then((data) => {
            if (data.files) setFiles(data.files);
            if (data.metadata) setMetadata(data.metadata);
            toast.success(
              `${uploadedFiles.length} arquivo(s) enviado(s) com sucesso!`
            );
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
        setUploadProgress(0);
      }, 500);
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
            <div className="flex-1 space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Buscar arquivos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setIsLoading(true);
                        getFiles(searchTerm, contentSearch)
                          .then((data) => {
                            if (data.files) setFiles(data.files);
                            if (data.metadata) setMetadata(data.metadata);
                          })
                          .catch(() => {
                            toast.error(
                              "Erro ao atualizar a lista de arquivos"
                            );
                          })
                          .finally(() => {
                            setIsLoading(false);
                          });
                      }
                    }}
                    className="pl-10"
                  />
                </div>
                <Button
                  onClick={() => {
                    setIsLoading(true);
                    getFiles(searchTerm, contentSearch)
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
                  }}
                  variant="outline"
                  className="gap-2"
                >
                  <Search className="h-4 w-4" />
                  Buscar
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="content-search"
                  checked={contentSearch}
                  onCheckedChange={(checked) =>
                    setContentSearch(checked as boolean)
                  }
                />
                <Label
                  htmlFor="content-search"
                  className="cursor-pointer flex items-center gap-1"
                >
                  Busca por conteúdo
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-slate-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Apenas txt, pdf, md e docx</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
              </div>
            </div>
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

          {isUploading && (
            <div className="mb-6 space-y-2">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Enviando arquivos...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                <Search className="h-8 w-8 text-slate-400 animate-pulse" />
              </div>
              <p className="text-slate-600">Carregando arquivos...</p>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                <Search className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-slate-600">
                {searchTerm
                  ? "Nenhum arquivo encontrado"
                  : "Nenhum arquivo adicionado ainda"}
              </p>
              <p className="text-sm text-slate-500 mt-2">
                Arraste arquivos ou clique no botão Upload
              </p>
            </div>
          ) : (
            <Files files={files} onDelete={handleDelete} onDownload={getFile} />
          )}
        </div>

        <div className="text-center text-sm text-slate-500">
          {searchTerm ? (
            <>
              {files.length} resultado
              {files.length !== 1 ? "s" : ""} ({metadata?.filteredSizeFormatted}
              ){" · "}
              Total: {files.length} arquivo{files.length !== 1 ? "s" : ""} (
              {metadata?.totalSizeFormatted})
            </>
          ) : (
            <>
              Total de arquivos: {files.length} · Espaço usado:{" "}
              {metadata?.totalSizeFormatted}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
