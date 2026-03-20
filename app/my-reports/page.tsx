'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function MyReportsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')

  // Mock data for submitted reports
  const [reports] = useState([
    {
      id: '1',
      project: 'Haksolok',
      quarter: 'Q1',
      date: '2024-03-15',
      time: '10:30 AM',
      coordinator: 'Ahmed Hassan',
    },
    {
      id: '2',
      project: 'Sudan',
      quarter: 'Q1',
      date: '2024-03-20',
      time: '02:15 PM',
      coordinator: 'Ahmed Hassan',
    },
    {
      id: '3',
      project: 'Libya',
      quarter: 'Q1',
      date: '2024-03-25',
      time: '11:45 AM',
      coordinator: 'Ahmed Hassan',
    },
    {
      id: '4',
      project: 'Beirut',
      quarter: 'Q1',
      date: '2024-04-01',
      time: '03:20 PM',
      coordinator: 'Ahmed Hassan',
    },
    {
      id: '5',
      project: 'Haksolok',
      quarter: 'Q2',
      date: '2024-06-10',
      time: '09:00 AM',
      coordinator: 'Ahmed Hassan',
    },
  ])

  const filteredReports = reports.filter((report) =>
    report.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.quarter.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/select" className="text-secondary hover:underline">
              ← Back
            </Link>
            <h1 className="text-3xl font-bold text-primary">My Reports</h1>
          </div>
          <Link
            href="/select"
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-900 transition-colors font-medium"
          >
            + New Report
          </Link>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg border border-border p-6 mb-6">
          <input
            type="text"
            placeholder="Search by project or quarter..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary bg-white"
          />
        </div>

        {/* Reports Table */}
        {filteredReports.length > 0 ? (
          <div className="bg-white rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                      Project
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                      Quarter
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                      Time
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-foreground">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((report) => (
                    <tr key={report.id} className="border-b border-border hover:bg-muted transition-colors">
                      <td className="px-6 py-4 text-sm text-foreground">{report.project}</td>
                      <td className="px-6 py-4 text-sm text-foreground">{report.quarter}</td>
                      <td className="px-6 py-4 text-sm text-foreground">{report.date}</td>
                      <td className="px-6 py-4 text-sm text-foreground">{report.time}</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => router.push(`/report/${report.id}`)}
                          className="text-secondary hover:underline font-medium text-sm"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-border p-12 text-center">
            <p className="text-muted-foreground mb-4">No reports found matching your search.</p>
            <Link
              href="/select"
              className="text-secondary hover:underline font-medium"
            >
              Create your first report
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
