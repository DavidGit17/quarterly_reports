"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/shared/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type MultiSelectOption = {
  value: string;
  label: string;
};

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select items...",
  searchPlaceholder = "Search...",
  emptyMessage = "No items found.",
  disabled = false,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const selectedSet = React.useMemo(() => new Set(selected), [selected]);

  const selectedLabels = React.useMemo(
    () => options.filter((o) => selectedSet.has(o.value)),
    [options, selectedSet],
  );

  const visibleSelected = React.useMemo(
    () => selectedLabels.slice(0, 2),
    [selectedLabels],
  );
  const hiddenCount = Math.max(
    selectedLabels.length - visibleSelected.length,
    0,
  );

  const handleToggle = (value: string) => {
    const updated = selectedSet.has(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            title={
              selectedLabels.length > 0
                ? selectedLabels.map((item) => item.label).join(", ")
                : undefined
            }
            className="w-full justify-between rounded-xl border-slate-200 bg-white text-sm font-normal"
          >
            <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1 text-left">
              {selected.length === 0 ? (
                <span className="text-slate-500">{placeholder}</span>
              ) : (
                <>
                  {visibleSelected.map((item) => (
                    <span
                      key={item.value}
                      className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                    >
                      {item.label}
                    </span>
                  ))}
                  {hiddenCount > 0 && (
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      +{hiddenCount}
                    </span>
                  )}
                </>
              )}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-80 p-0"
          align="start"
          sideOffset={4}
        >
          <Command className="flex h-full flex-col">
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList className="max-h-65 overflow-y-auto">
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup className="overflow-y-auto">
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => handleToggle(option.value)}
                  >
                    <div
                      className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border",
                        selectedSet.has(option.value)
                          ? "border-[#2563EB] bg-[#2563EB] text-white"
                          : "border-slate-300",
                      )}
                    >
                      {selectedSet.has(option.value) && (
                        <Check className="h-3 w-3" />
                      )}
                    </div>
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
