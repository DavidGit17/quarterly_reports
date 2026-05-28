import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/shared/utils";

interface ToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit?: () => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function Toolbar({
  searchValue,
  onSearchChange,
  onSearchSubmit,
  searchPlaceholder = "Search...",
  filters,
  actions,
  className,
}: ToolbarProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onSearchSubmit) {
      onSearchSubmit();
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm",
        className,
      )}
    >
      <div className="flex flex-1 items-center gap-2 min-w-0">
        <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <Input
          type="text"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="border-0 bg-transparent outline-none flex-1 min-w-0"
        />
      </div>

      {filters && <div className="flex flex-wrap gap-2">{filters}</div>}

      {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}
