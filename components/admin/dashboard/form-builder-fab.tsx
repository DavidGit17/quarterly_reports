"use client";

import { Plus } from "lucide-react";
import Link from "next/link";

export function FormBuilderFAB() {
  return (
    <>
      {/* Mobile: Show as FAB */}
      <Link
        href="/form-builder"
        className="md:hidden fixed bottom-6 right-6 z-40 flex items-center justify-center w-14 h-14 bg-slate-700 hover:bg-slate-800 text-white rounded-full transition-all active:scale-95"
      >
        <Plus className="w-6 h-6" />
        <span className="sr-only">Open form builder</span>
      </Link>
    </>
  );
}
