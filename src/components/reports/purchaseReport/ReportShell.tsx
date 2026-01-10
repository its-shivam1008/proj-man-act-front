import { Download, Filter } from "lucide-react";
import React from "react";

interface ReportShellProps {
  title: string;
  subtitle?: string; // ✅ optional
  children: React.ReactNode;
}

export default function ReportShell({
  title,
  subtitle,
  children,
}: ReportShellProps) {
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {title}
          </h2>

          {/* ✅ render only if provided */}
          {subtitle && (
            <p className="text-sm text-gray-500">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm hover:bg-gray-50 transition">
            <Filter size={16} />
            Filters
          </button>

          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm hover:bg-black transition">
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* CONTENT */}
      {children}
    </div>
  );
}
