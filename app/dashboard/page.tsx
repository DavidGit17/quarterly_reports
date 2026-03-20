"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Report {
  id: string;
  project: string;
  quarter: string;
  coordinator: string;
  date: string;
  time: string;
}

interface ProjectData {
  [key: string]: {
    [key: string]: Report[];
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [role] = useState("admin");
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  // Check if user is admin (this is UI-only simulation)
  useEffect(() => {
    // In a real app, check actual authentication
    // For this demo, we simulate admin role
    const isAdmin = role === "admin";
    if (!isAdmin) {
      setIsUnauthorized(true);
    }
  }, [role]);

  // Mock data organized by Project -> Quarter -> Reports
  const [reportData] = useState<ProjectData>({
    Haksolok: {
      Q1: [
        {
          id: "1",
          project: "Haksolok",
          quarter: "Q1",
          coordinator: "Ahmed Hassan",
          date: "2024-03-15",
          time: "10:30 AM",
        },
        {
          id: "2",
          project: "Haksolok",
          quarter: "Q1",
          coordinator: "Fatima Ali",
          date: "2024-03-18",
          time: "02:00 PM",
        },
      ],
      Q2: [
        {
          id: "3",
          project: "Haksolok",
          quarter: "Q2",
          coordinator: "Ahmed Hassan",
          date: "2024-06-10",
          time: "09:00 AM",
        },
      ],
    },
    Sudan: {
      Q1: [
        {
          id: "4",
          project: "Sudan",
          quarter: "Q1",
          coordinator: "Mohammed Saleh",
          date: "2024-03-20",
          time: "02:15 PM",
        },
      ],
      Q2: [
        {
          id: "5",
          project: "Sudan",
          quarter: "Q2",
          coordinator: "Mohammed Saleh",
          date: "2024-06-15",
          time: "11:00 AM",
        },
      ],
    },
    Libya: {
      Q1: [
        {
          id: "6",
          project: "Libya",
          quarter: "Q1",
          coordinator: "Noor El-Deen",
          date: "2024-03-25",
          time: "11:45 AM",
        },
      ],
    },
    Beirut: {
      Q1: [
        {
          id: "7",
          project: "Beirut",
          quarter: "Q1",
          coordinator: "Sara Khalil",
          date: "2024-04-01",
          time: "03:20 PM",
        },
      ],
    },
  });

  // Filter reports based on search
  const filteredProjects = Object.keys(reportData).filter((project) =>
    project.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (isUnauthorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="bg-white rounded-lg border border-border p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-primary mb-4">
            Access Denied
          </h1>
          <p className="text-muted-foreground mb-6">
            You do not have permission to access the admin dashboard. Please
            login with an admin account.
          </p>
          <Link
            href="/login"
            className="text-secondary hover:underline font-medium"
          >
            Return to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-primary">Admin Dashboard</h1>
          <Link
            href="/profile?role=admin"
            className="text-secondary hover:underline font-medium"
          >
            Profile
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-border p-6">
            <p className="text-sm text-muted-foreground mb-2">Total Projects</p>
            <p className="text-3xl font-bold text-primary">4</p>
          </div>
          <div className="bg-white rounded-lg border border-border p-6">
            <p className="text-sm text-muted-foreground mb-2">Total Reports</p>
            <p className="text-3xl font-bold text-primary">7</p>
          </div>
          <div className="bg-white rounded-lg border border-border p-6">
            <p className="text-sm text-muted-foreground mb-2">
              Active Coordinators
            </p>
            <p className="text-3xl font-bold text-primary">4</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg border border-border p-6 mb-6">
          <input
            type="text"
            placeholder="Search by project name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary bg-white"
          />
        </div>

        {/* Reports Organized by Project -> Quarter */}
        {filteredProjects.length > 0 ? (
          <div className="space-y-8">
            {filteredProjects.map((project) => (
              <div key={project}>
                <h2 className="text-2xl font-bold text-foreground mb-4 pb-4 border-b border-border">
                  {project}
                </h2>

                {Object.keys(reportData[project]).map((quarter) => (
                  <div key={`${project}-${quarter}`} className="mb-6">
                    <h3 className="text-lg font-semibold text-foreground mb-3 ml-4">
                      {quarter}
                    </h3>

                    <div className="grid gap-4">
                      {reportData[project][quarter].map((report) => (
                        <div
                          key={report.id}
                          className="bg-white rounded-lg border border-border p-6 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <p className="text-sm text-muted-foreground mb-1">
                                Submitted by:{" "}
                                <span className="text-foreground font-medium">
                                  {report.coordinator}
                                </span>
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {report.date} at {report.time}
                              </p>
                            </div>
                            <button
                              onClick={() =>
                                router.push(`/report/${report.id}`)
                              }
                              className="bg-secondary text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium whitespace-nowrap"
                            >
                              View Report
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-border p-12 text-center">
            <p className="text-muted-foreground">
              {searchTerm
                ? "No projects found matching your search."
                : "No reports available."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
