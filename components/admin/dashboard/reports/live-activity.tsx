import { ActiveSession } from '@/components/admin/dashboard/mock-data'

interface LiveActivityProps {
  sessions: ActiveSession[]
}

export function LiveActivity({ sessions }: LiveActivityProps) {
  if (sessions.length === 0) {
    return (
      <div className="border border-slate-200 rounded-lg p-6 mb-6">
        <h2 className="text-base font-semibold text-slate-900 mb-4">
          Active Submission Sessions
        </h2>
        <p className="text-sm text-slate-500">
          No coordinators currently filling reports.
        </p>
      </div>
    )
  }

  return (
    <div className="border border-slate-200 rounded-lg mb-6">
      <div className="px-6 py-4 border-b border-slate-200">
        <h2 className="text-base font-semibold text-slate-900">
          Active Submission Sessions
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Coordinators currently filling reports
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Project
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Language
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Quarter
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Coordinator
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Last Activity
              </th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session, index) => (
              <tr
                key={`${session.coordinator}-${index}`}
                className="border-b border-slate-100 hover:bg-slate-50 transition-colors last:border-b-0"
              >
                <td className="px-6 py-3 font-medium text-slate-900">
                  {session.project}
                </td>
                <td className="px-6 py-3 text-slate-600">
                  {session.language}
                </td>
                <td className="px-6 py-3 text-slate-600">
                  {session.quarter}
                </td>
                <td className="px-6 py-3 text-slate-600">
                  {session.coordinator}
                </td>
                <td className="px-6 py-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                    In Progress
                  </span>
                </td>
                <td className="px-6 py-3 text-slate-500">
                  {session.lastActivity}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}