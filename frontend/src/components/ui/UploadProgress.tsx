import { Progress } from "@radix-ui/react-progress";

const statusStyles = {
  completed: {
    textColor: "text-green-600",
    barColor: "bg-green-500",
    message: "✓ Concluído",
  },
  error: {
    textColor: "text-red-600",
    barColor: "bg-red-500",
    message: "✗ Erro",
  },
  uploading: {
    textColor: "text-blue-600",
    barColor: "",
  },
} as const;

type FileUploadProgress = {
  name: string;
  progress: number;
  status: "uploading" | "completed" | "error";
};
function UploadProgress({
  isUploading,
  uploadProgress,
}: {
  isUploading: boolean;
  uploadProgress: FileUploadProgress[];
}) {
  if (!isUploading) return null;
  return (
    <>
      <div className="mb-6 space-y-3">
        <div className="text-sm font-medium text-slate-700 mb-2">
          Enviando {uploadProgress.length} arquivo
          {uploadProgress.length !== 1 ? "s" : ""}...
        </div>
        {uploadProgress.map((file, index) => (
          <div key={index} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 truncate max-w-[70%]">
                {file.name}
              </span>
              <span
                className={`font-medium ${statusStyles[file.status].textColor}`}
              >
                {file.status === "completed"
                  ? "✓ Concluído"
                  : file.status === "error"
                  ? "✗ Erro"
                  : `${file.progress}%`}
              </span>
            </div>
            <Progress
              value={file.progress}
              className={`${statusStyles[file.status].barColor}`}
            />
          </div>
        ))}
      </div>
    </>
  );
}
export default UploadProgress;
