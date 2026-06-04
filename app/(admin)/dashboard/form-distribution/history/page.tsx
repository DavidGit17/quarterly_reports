"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/admin/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input-shadcn";
import { ChevronLeft, ChevronRight, Search, ExternalLink } from "lucide-react";
import { formatIsoDateTime } from "@/lib/shared/date-format";

interface SendHistoryItem {
  id: string;
  ruleName: string;
  projectName: string;
  recipientEmail: string;
  recipientRole: string | null;
  status: "sent" | "failed";
  errorMessage: string | null;
  sentAt: string;
  formLink: string;
}

export default function SendHistoryPage() {
  const [items, setItems] = useState<SendHistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "50");
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/admin/send-history?${params}`);
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const filteredItems = search
    ? items.filter(
        (i) =>
          i.ruleName.toLowerCase().includes(search.toLowerCase()) ||
          i.recipientEmail.toLowerCase().includes(search.toLowerCase()) ||
          i.projectName.toLowerCase().includes(search.toLowerCase()),
      )
    : items;

  return (
    <main className="flex-1 p-4 md:p-6 mx-auto max-w-7xl w-full">
      <PageHeader
        title="Send History"
        subtitle="View all form distribution sends and their delivery status"
      />

      <div className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0 w-full sm:w-auto">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search by rule, email, or project"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="border-0 bg-transparent outline-none flex-1 min-w-0 p-0 h-auto text-sm"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-1 focus:ring-slate-400"
              >
                <option value="">All status</option>
                <option value="sent">Sent</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <p className="text-sm text-slate-500 shrink-0">
              {total} send{total === 1 ? "" : "s"} total
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left h-10 px-4 text-sm font-medium text-slate-700 whitespace-nowrap">Rule</th>
                <th className="text-left h-10 px-4 text-sm font-medium text-slate-700 whitespace-nowrap">Project</th>
                <th className="text-left h-10 px-4 text-sm font-medium text-slate-700 whitespace-nowrap">Recipient</th>
                <th className="text-left h-10 px-4 text-sm font-medium text-slate-700 whitespace-nowrap">Status</th>
                <th className="text-left h-10 px-4 text-sm font-medium text-slate-700 whitespace-nowrap">Sent At</th>
                <th className="text-right h-10 px-4 text-sm font-medium text-slate-700 whitespace-nowrap">Link</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-sm text-slate-500">
                    Loading...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-sm text-slate-500">
                    No send history found.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 border-b border-slate-100 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900 whitespace-nowrap">
                      {item.ruleName}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                      {item.projectName}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                      <div>{item.recipientEmail}</div>
                      {item.recipientRole && (
                        <div className="text-xs text-slate-400 capitalize">{item.recipientRole}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-2xl text-xs font-medium ${
                          item.status === "sent"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {item.status}
                      </span>
                      {item.errorMessage && (
                        <p className="text-xs text-red-600 mt-1 max-w-xs truncate" title={item.errorMessage}>
                          {item.errorMessage}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                      {formatIsoDateTime(item.sentAt)}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <a
                        href={item.formLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
            <p className="text-sm text-slate-600">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-slate-200 bg-white min-w-[44px] min-h-[44px] p-3 text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-lg border border-slate-200 bg-white min-w-[44px] min-h-[44px] p-3 text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
