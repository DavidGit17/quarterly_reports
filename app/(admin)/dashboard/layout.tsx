import { DashboardLayout } from "@/components/admin/dashboard/layout";

export default function DashboardShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
