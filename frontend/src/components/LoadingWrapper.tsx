import { Search } from "lucide-react";

function LoadingWrapper({
  isLoading,
  children,
}: {
  isLoading?: boolean;
  children?: React.ReactNode;
}) {
  if (isLoading)
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
          <Search className="h-8 w-8 text-slate-400 animate-pulse" />
        </div>
        <p className="text-slate-600">Carregando arquivos...</p>
      </div>
    );
  return <>{children}</>;
}
export default LoadingWrapper;
