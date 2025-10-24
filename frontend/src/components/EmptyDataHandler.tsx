import { Search } from "lucide-react";

function EmptyDataHandler({
  children,
  filesLength,
  isFilterApplied,
}: {
  children?: React.ReactNode;
  filesLength: number;
  isFilterApplied: boolean;
}) {
  if (filesLength === 0)
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
          <Search className="h-8 w-8 text-slate-400" />
        </div>
        <p className="text-slate-600">
          {isFilterApplied
            ? "Nenhum arquivo encontrado"
            : "Nenhum arquivo adicionado ainda"}
        </p>
        <p className="text-sm text-slate-500 mt-2">
          Arraste arquivos ou clique no botão Upload
        </p>
      </div>
    );

  return <>{children}</>;
}

export default EmptyDataHandler;
