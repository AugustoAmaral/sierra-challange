import { Info, Search } from "lucide-react";
import { Input } from "./ui/input";
import { Checkbox } from "@radix-ui/react-checkbox";
import { Label } from "@radix-ui/react-label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";

function SearchBar({
  searchTerm,
  onChangeSearchTerm,
  contentSearch,
  onChangeContentSearch,
}: {
  searchTerm: string;
  onChangeSearchTerm: (value: string) => void;
  contentSearch: boolean;
  onChangeContentSearch: (value: boolean) => void;
}) {
  return (
    <div className="flex-1 space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          type="text"
          placeholder="Buscar arquivos..."
          value={searchTerm}
          onChange={(e) => onChangeSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="content-search"
          checked={contentSearch}
          onCheckedChange={(checked) =>
            onChangeContentSearch(checked as boolean)
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
  );
}
export default SearchBar;
