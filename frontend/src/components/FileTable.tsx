import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Button } from "./ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { Download, Trash2 } from "lucide-react";
import type { ComponentProps } from "react";
import type Files from "./Files";
import { formatDateTime, formatFileSize } from "../utils";

export function FileTable({
  files,
  onDelete,
  onDownload,
}: ComponentProps<typeof Files>) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>File Name</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Date & Time</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {files.map((file) => (
            <TableRow key={file.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="flex-shrink-0 w-8 h-8 rounded bg-slate-100 flex items-center justify-center">
                    <span className="text-xs text-slate-600">
                      {file.extension.toUpperCase()}
                    </span>
                  </div>
                  <span className="truncate">{file.name}</span>
                </div>
              </TableCell>
              <TableCell>{formatFileSize(file.size)}</TableCell>
              <TableCell>{formatDateTime(file.createdAt)}</TableCell>
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDownload(file.id)}
                    className="gap-1"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1">
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirm deletion</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{file.name}"? This
                          action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(file.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
