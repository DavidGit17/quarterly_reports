import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Project } from "@/components/admin/dashboard/mock-data";
import { Briefcase, CircleCheckBig, CirclePause, Timer } from "lucide-react";

interface ProjectsSummaryProps {
  projects: Project[];
}

export function ProjectsSummary({ projects }: ProjectsSummaryProps) {
  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.status === "active").length;
  const inactiveProjects = projects.filter(
    (p) => p.status === "inactive",
  ).length;
  const pendingProjects = projects.filter((p) => p.status === "pending").length;

  const stats = [
    {
      label: "Total Projects",
      value: totalProjects,
      icon: Briefcase,
      color: "text-slate-400",
    },
    {
      label: "Active",
      value: activeProjects,
      icon: CircleCheckBig,
      color: "text-green-500",
    },
    {
      label: "Inactive",
      value: inactiveProjects,
      icon: CirclePause,
      color: "text-slate-400",
    },
    {
      label: "Pending",
      value: pendingProjects,
      icon: Timer,
      color: "text-orange-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-slate-900">
                  {stat.value}
                </span>
                <Icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
