import { Card, CardContent } from "@/components/ui/card";
import type { ReportsTableReport } from "@/components/admin/dashboard/reports/reports-table";

interface ReportsSummaryProps {
  reports: ReportsTableReport[];
}

export function ReportsSummary({ reports }: ReportsSummaryProps) {
  const totalReports = reports.length;
  const submittedReports = reports.filter(
    (r) => r.status === "submitted",
  ).length;

  const stats = [
    { label: "Total Reports", value: totalReports },
    { label: "Submitted", value: submittedReports },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {stats.map((stat) => (
        <Card key={stat.label} className="rounded-2xl">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-slate-600">{stat.label}</p>
            <p className="text-3xl font-bold mt-2 text-slate-700">
              {stat.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
