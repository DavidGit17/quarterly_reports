"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/shared/utils";

type PasswordInputProps = Omit<React.ComponentProps<"input">, "type">;

function PasswordInput({ className, onChange, value, autoComplete = "new-password", ...props }: PasswordInputProps) {
  const [show, setShow] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Sync external value changes to the DOM property (not HTML attribute).
  // Guards against cursor-jump by only writing when the DOM actually differs.
  React.useEffect(() => {
    if (inputRef.current && inputRef.current.value !== (value as string)) {
      inputRef.current.value = value as string;
    }
  }, [value]);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        data-slot="password-input"
        data-show={show ? "true" : undefined}
        className={cn(
          "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pr-9 [&:not([data-show])]:[-webkit-text-security:disc]",
          "focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-[2px]",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          className,
        )}
        autoComplete={autoComplete}
        onChange={(e) => {
          onChange?.(e);
        }}
        {...props}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow((s) => !s)}
        className="absolute right-0 top-0 flex h-full items-center px-3 text-muted-foreground hover:text-foreground transition-colors"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}

export { PasswordInput };
