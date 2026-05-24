"use client";

import { Menu, Search, Bell, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

interface HeaderProps {
  onMobileMenuClick?: () => void;
}

export function Header({ onMobileMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
      <div className="flex h-16 items-center justify-between px-4 md:px-10">
        {/* Left: Mobile menu and search */}
        <div className="flex items-center gap-4 flex-1 md:flex-none">
          <button
            onClick={onMobileMenuClick}
            className="md:hidden p-2 hover:bg-slate-100 rounded transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5 text-slate-700" />
          </button>

          {/* Desktop search */}
          <div className="hidden md:flex relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="search"
              placeholder="Search reports..."
              className="rounded border-slate-200 bg-slate-50 pl-10 pr-4 text-slate-900 placeholder:text-slate-500 focus-visible:ring-slate-200"
            />
          </div>
        </div>

        {/* Right: Title (mobile) and actions */}
        <div className="md:hidden flex-1 text-center">
          <h2 className="text-sm font-semibold text-slate-900">Reports</h2>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative p-2 hover:bg-slate-100 rounded transition-colors">
            <Bell className="w-5 h-5 text-slate-700" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Profile dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 hover:bg-slate-100 rounded transition-colors">
                <Avatar className="w-8 h-8">
                  <AvatarImage
                    src="https://avatar.vercel.sh/jsmith"
                    alt="User"
                  />
                  <AvatarFallback>JS</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium text-slate-900">Jane Smith</p>
                <p className="text-xs text-slate-500">jane.smith@company.com</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">My Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600" asChild>
                <Link href="/login">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile search bar */}
      <div className="md:hidden border-t border-slate-200 px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="search"
            placeholder="Search reports..."
            className="w-full rounded border-slate-200 bg-slate-50 pl-10 pr-4 text-slate-900 placeholder:text-slate-500 focus-visible:ring-slate-200"
          />
        </div>
      </div>
    </header>
  );
}
