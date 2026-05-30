/**
 * Design System Form Constants
 * Unified form styling constants used across coordinator, facilitator, and admin pages
 * Implements Microsoft Fluent-style form design with #004446 focus ring
 */

// Base form surfaces
export const FORM_SURFACE_CLASS =
  "rounded-2xl bg-white shadow-sm border border-slate-100";

// Form field styling
export const FORM_FIELD_CLASS =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base font-medium placeholder:text-slate-400 focus:border-[#004446] focus:outline-none focus:ring-0 dark:bg-slate-900 dark:border-slate-700 dark:text-white disabled:bg-slate-50 disabled:text-slate-400";

// Form labels
export const FORM_LABEL_CLASS =
  "block text-base font-medium text-slate-800 dark:text-slate-100";

// Required field indicator
export const FORM_REQUIRED_CLASS =
  "text-red-400 font-semibold";

// Form metadata and hints
export const FORM_META_CLASS =
  "text-sm text-slate-500 dark:text-slate-400";

// Primary action buttons (Green/Teal - used in coordinator/facilitator)
export const FORM_PRIMARY_BUTTON_CLASS =
  "inline-flex items-center justify-center rounded-xl bg-[#4b6358] px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#3d4f48] focus:ring-2 focus:ring-[#004446] focus:ring-offset-2 focus:outline-none disabled:bg-slate-300 disabled:text-slate-500";

// Secondary/cancel buttons
export const FORM_SECONDARY_BUTTON_CLASS =
  "inline-flex items-center justify-center rounded-xl bg-slate-100 px-6 py-2 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-200 focus:ring-2 focus:ring-[#004446] focus:ring-offset-2 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400";

// Admin/Dashboard Primary Button (Grey)
export const ADMIN_PRIMARY_BUTTON_CLASS =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus:ring-1 focus:ring-slate-400 focus:ring-offset-2 focus:outline-none disabled:bg-slate-300 disabled:text-slate-500";

// Admin Secondary Button
export const ADMIN_SECONDARY_BUTTON_CLASS =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-6 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-200 focus:ring-2 focus:ring-[#004446] focus:ring-offset-2 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400";

// Form sections with dividers
export const FORM_SECTION_DIVIDER_CLASS =
  "border-t border-slate-100 dark:border-slate-700 pt-6";

// Field container
export const FORM_FIELD_CONTAINER_CLASS =
  "space-y-2";

// Quarter/info display card (read-only)
export const FORM_INFO_CARD_CLASS =
  "rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300";

// Dialog/modal styling
export const FORM_DIALOG_CLASS =
  "rounded-2xl border border-slate-100 bg-white shadow-lg dark:bg-slate-950 dark:border-slate-800";

