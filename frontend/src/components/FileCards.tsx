import { Calendar, Download, HardDrive, Trash2 } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogFooter,
  AlertDialogHeader,
} from "./ui/alert-dialog";
import type { ComponentProps } from "react";
import Files from "./Files";
import { formatDateTime, formatFileSize } from "../utils";

function FileCards({
  files,
  onDelete,
  onDownload,
}: ComponentProps<typeof Files>) {
  return (
    <div className="space-y-3">
      {files.map((file) => (
        <Card key={file.id} className="p-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded bg-slate-100 flex items-center justify-center">
                <span className="text-xs text-slate-600">
                  {file.extension.toUpperCase()}
                </span>
              </div>
              <p className="truncate flex-1 font-medium">{file.name}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm text-slate-500 pl-[52px]">
              <div className="flex items-center gap-1">
                <HardDrive className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{formatFileSize(file.size)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">
                  {formatDateTime(file.createdAt)}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pl-[52px]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDownload(file.id)}
                className="gap-2 flex-1"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 flex-1">
                    <Trash2 className="h-4 w-4" />
                    Apagar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja apagar "{file.name}"? Esta ação não
                      pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(file.id)}>
                      Apagar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default FileCards;
