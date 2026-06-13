"use client";

import {
  LifeBuoy,
  BookOpen,
  Bug,
  MessageSquareText,
  Megaphone,
  CircleHelp,
} from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

interface HelpMenuItem {
  icon: React.ReactNode;
  label: string;
  description: string;
  action: () => void;
}

const helpMenuItems: HelpMenuItem[] = [
  {
    icon: <LifeBuoy className="w-5 h-5" />,
    label: "Contact Support",
    description:
      "Get assistance with account access, reports, forms, permissions, and system issues.",
    // TODO: Replace with actual support integration (email, helpdesk, Teams channel, or ticket system)
    action: () => {},
  },
  {
    icon: <BookOpen className="w-5 h-5" />,
    label: "Documentation",
    description: "View QRMS user guides and documentation.",
    // TODO: Replace with internal documentation portal, user guides, or training resources
    action: () => {},
  },
  {
    icon: <Bug className="w-5 h-5" />,
    label: "Report an Issue",
    description: "Report bugs, unexpected behavior, or technical problems.",
    // TODO: Replace with bug reporting form, support ticket creation, or issue report flow
    action: () => {},
  },
  {
    icon: <MessageSquareText className="w-5 h-5" />,
    label: "Give Feedback",
    description: "Suggest improvements and new features.",
    // TODO: Replace with feature request form, feedback portal, or product improvement workflow
    action: () => {},
  },
  {
    icon: <Megaphone className="w-5 h-5" />,
    label: "Release Notes",
    description: "View recent system updates and improvements.",
    // TODO: Replace with release notes page, latest changes view, or version history
    action: () => {},
  },
];

export function HelpPanel() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          aria-label="Help & Support"
          title="Help & Support"
        >
          <CircleHelp className="w-5 h-5 text-slate-500" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={8}
        avoidCollisions={false}
        className="w-[360px] sm:w-[400px] max-w-[calc(100vw-1rem)] p-0 border-slate-200 rounded-2xl shadow-xl bg-white overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-slate-200">
          <h3 className="font-heading text-lg font-semibold text-slate-900">
            Help &amp; Support
          </h3>
          <p className="font-ui text-sm text-slate-500 mt-1">
            Get help, report issues, and stay informed about QRMS updates.
          </p>
        </div>

        {/* Menu items */}
        <div className="max-h-[60vh] overflow-y-auto px-5 py-4 space-y-2">
          {helpMenuItems.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={item.action}
              className="w-full flex items-start gap-4 p-3 rounded-xl text-left hover:bg-slate-50 transition-colors group"
            >
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-slate-700 transition-colors">
                {item.icon}
              </span>
              <div className="min-w-0 flex-1">
                <span className="block font-ui text-sm font-semibold text-slate-900 group-hover:text-primary transition-colors">
                  {item.label}
                </span>
                <span className="block font-ui text-xs text-slate-500 mt-0.5 leading-normal">
                  {item.description}
                </span>
              </div>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
