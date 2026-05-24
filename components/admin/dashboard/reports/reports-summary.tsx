import { Card, CardContent } from "@/components/ui/card";
import { ActiveSession } from "@/components/admin/dashboard/mock-data";
import type { ReportsTableReport } from "@/components/admin/dashboard/reports/reports-table";

interface ReportsSummaryProps {
  reports: ReportsTableReport[];
  activeSessions?: ActiveSession[];
}

export function ReportsSummary({
  reports,
  activeSessions = [],
}: ReportsSummaryProps) {
  const totalReports = reports.length;
  const draftReports = reports.filter((r) => r.status === "draft").length;
  const submittedReports = reports.filter(
    (r) => r.status === "submitted",
  ).length;
  const approvedReports = reports.filter((r) => r.status === "approved").length;
  const inProgressCount = activeSessions.length;

  const stats = [
    { label: "Total Reports", value: totalReports, color: "blue" },
    { label: "Draft", value: draftReports, color: "yellow" },
    { label: "Submitted", value: submittedReports, color: "blue" },
    { label: "Approved", value: approvedReports, color: "green" },
    { label: "In Progress", value: inProgressCount, color: "slate" },
  ];

  const colorClasses: Record<string, string> = {
    blue: "text-slate-700",
    green: "text-green-600",
    yellow: "text-yellow-600",
    slate: "text-slate-600",
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-slate-600">{stat.label}</p>
            <p
              className={`text-3xl font-bold mt-2 ${colorClasses[stat.color]}`}
            >
              {stat.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
