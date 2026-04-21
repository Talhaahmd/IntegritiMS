"use client";
import { Bell, Search } from "lucide-react";
import { useState } from "react";
import { formatDate } from "@/lib/utils";

export default function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  const [search, setSearch] = useState("");

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between px-8 h-[60px] bg-white/90 backdrop-blur-sm border-b border-gray-100">
      {/* Left — page title */}
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-2.5">
        {/* Search */}
        <div className="relative">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            className="input-base pl-8 h-8 w-48 text-sm rounded-lg text-[13px]"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Date pill */}
        <div className="text-[12px] px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100 text-gray-500 font-medium">
          {formatDate(new Date(), "EEE, MMM d")}
        </div>

        {/* Bell */}
        <button className="relative w-8 h-8 rounded-lg border border-gray-100 bg-white flex items-center justify-center hover:bg-gray-50 transition-colors shadow-xs text-gray-500">
          <Bell size={14} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
        </button>
      </div>
    </header>
  );
}
