'use client'

import { useState, Suspense } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function ReportDetailsContent() {
  const params = useParams()
  const router = useRouter()
  const reportId = params.id as string

  // Mock report data
  const reportData: { [key: string]: any } = {
    '1': {
      id: '1',
      project: 'Haksolok',
      quarter: 'Q1',
      coordinator: 'Ahmed Hassan',
      date: '2024-03-15',
      time: '10:30 AM',
      fields: [
        { label: 'Project Overview', value: 'The project has progressed well in Q1 with all major milestones achieved on schedule.' },
        { label: 'Key Achievements', value: 'Completed Phase 1 of implementation, secured stakeholder approval, and established partnerships with 3 key vendors.' },
        { label: 'Challenges Faced', value: 'Minor delays in initial resource allocation and weather-related site access issues.' },
        { label: 'Budget Status', value: 'On track - 98% of Q1 budget allocated, projected to finish within allocated funds.' },
        { label: 'Timeline Progress', value: 'All major deliverables completed. Q2 planning in progress.' },
        { label: 'Resource Allocation', value: '15 team members assigned, 95% utilization rate.' },
        { label: 'Team Performance', value: 'Excellent performance, with 3 team members exceeding targets.' },
        { label: 'Quality Metrics', value: 'Zero critical defects, 99.2% uptime achieved.' },
        { label: 'Risk Assessment', value: 'Medium risk - weather dependency identified. Mitigation strategies in place.' },
        { label: 'Stakeholder Feedback', value: 'Highly positive feedback from all stakeholders.' },
        { label: 'Lessons Learned', value: 'Early vendor engagement critical for smooth operations.' },
        { label: 'Next Quarter Plans', value: 'Begin Phase 2, expand team by 5 members, implement automation.' },
        { label: 'Financial Summary', value: '$250K budget, $245K spent, 2% variance.' },
        { label: 'Operational Status', value: 'All systems operational and performing above baseline.' },
        { label: 'Compliance Status', value: 'Fully compliant with all regulatory requirements.' },
        { label: 'Customer Satisfaction', value: 'NPS score: 78 - Very Satisfied.' },
        { label: 'Market Analysis', value: 'Market conditions remain favorable for expansion.' },
        { label: 'Competitive Position', value: 'Maintained market leadership position.' },
        { label: 'Innovation Updates', value: 'Implemented 2 new technological solutions.' },
        { label: 'Technology Stack', value: 'Upgraded to latest versions, all systems compatible.' },
        { label: 'Security Status', value: 'All security audits passed with no findings.' },
        { label: 'Performance Metrics', value: 'Average response time: 200ms, throughput: 10k req/s.' },
        { label: 'Strategic Alignment', value: 'Fully aligned with company strategic objectives.' },
        { label: 'Partnership Updates', value: 'Successfully onboarded 3 new partners.' },
        { label: 'Training & Development', value: 'Conducted 4 training sessions, 100% team participation.' },
        { label: 'Environmental Impact', value: 'Reduced carbon footprint by 15%, recycled 2 tons of waste.' },
        { label: 'Additional Notes', value: 'Exceptional quarter with strong team cohesion and commitment to excellence.' },
      ],
      files: [
        { name: 'Q1_Analysis.pdf', type: 'PDF' },
        { name: 'Team_Photo.jpg', type: 'Image' },
        { name: 'Project_Demo.mp4', type: 'Video' },
      ],
    },
    '2': {
      id: '2',
      project: 'Sudan',
      quarter: 'Q1',
      coordinator: 'Mohammed Saleh',
      date: '2024-03-20',
      time: '02:15 PM',
      fields: [
        { label: 'Project Overview', value: 'Sudan project showed steady progress with strong local partnerships.' },
        { label: 'Key Achievements', value: 'Established regional office, trained 50 local staff members.' },
        { label: 'Challenges Faced', value: 'Infrastructure limitations and initial cultural adaptation period.' },
        { label: 'Budget Status', value: 'Within 5% of budget allocation.' },
        { label: 'Timeline Progress', value: 'Slight delay due to logistics, expected to catch up in Q2.' },
        { label: 'Resource Allocation', value: '25 team members on ground.' },
        { label: 'Team Performance', value: 'Strong performance with high motivation.' },
        { label: 'Quality Metrics', value: '98.5% quality score.' },
        { label: 'Risk Assessment', value: 'Medium - political situation requires monitoring.' },
        { label: 'Stakeholder Feedback', value: 'Positive feedback from local government.' },
        { label: 'Lessons Learned', value: 'Local partnerships essential for success.' },
        { label: 'Next Quarter Plans', value: 'Expand operations, increase staff training.' },
        { label: 'Financial Summary', value: 'Budget tracking well, minor overages in logistics.' },
        { label: 'Operational Status', value: 'All operations running smoothly.' },
        { label: 'Compliance Status', value: 'Compliant with local regulations.' },
        { label: 'Customer Satisfaction', value: 'NPS: 75.' },
        { label: 'Market Analysis', value: 'Growing market with good expansion potential.' },
        { label: 'Competitive Position', value: 'Strong position in regional market.' },
        { label: 'Innovation Updates', value: 'Implementing local technology partnerships.' },
        { label: 'Technology Stack', value: 'Adapted for local infrastructure.' },
        { label: 'Security Status', value: 'Enhanced security protocols in place.' },
        { label: 'Performance Metrics', value: 'Meeting all KPIs.' },
        { label: 'Strategic Alignment', value: 'Aligned with regional expansion strategy.' },
        { label: 'Partnership Updates', value: 'Strengthened partnerships with local stakeholders.' },
        { label: 'Training & Development', value: 'Intensive local staff development program.' },
        { label: 'Environmental Impact', value: 'Implementing sustainable practices.' },
        { label: 'Additional Notes', value: 'Excellent start to regional operations.' },
      ],
      files: [
        { name: 'Regional_Report.pdf', type: 'PDF' },
        { name: 'Office_Setup.jpg', type: 'Image' },
      ],
    },
  }

  const report = reportData[reportId] || reportData['1']

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.back()} className="text-secondary hover:underline">
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-primary">Report Details</h1>
        </div>

        {/* Report Header Info */}
        <div className="bg-white rounded-lg border border-border p-8 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div>
              <p className="text-xs text-muted-foreground uppercase mb-1">Project</p>
              <p className="font-semibold text-foreground">{report.project}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase mb-1">Quarter</p>
              <p className="font-semibold text-foreground">{report.quarter}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase mb-1">Submitted By</p>
              <p className="font-semibold text-foreground">{report.coordinator}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase mb-1">Date & Time</p>
              <p className="font-semibold text-foreground">{report.date} {report.time}</p>
            </div>
          </div>
        </div>

        {/* Report Fields */}
        <div className="space-y-4 mb-6">
          <h2 className="text-xl font-bold text-foreground mb-4">Report Content</h2>
          {report.fields.map((field: any, index: number) => (
            <div key={index} className="bg-white rounded-lg border border-border p-6">
              <h3 className="text-sm font-semibold text-primary mb-3">
                {index + 1}. {field.label}
              </h3>
              <p className="text-sm text-foreground leading-relaxed">{field.value}</p>
            </div>
          ))}
        </div>

        {/* Uploaded Files */}
        {report.files && report.files.length > 0 && (
          <div className="bg-white rounded-lg border border-border p-6 mb-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Uploaded Files</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.files.map((file: any, index: number) => (
                <div
                  key={index}
                  className="border border-border rounded-lg p-4 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{file.type}</p>
                    </div>
                    <a
                      href="#"
                      className="text-secondary hover:underline text-sm font-medium"
                    >
                      Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => router.back()}
            className="flex-1 bg-muted text-foreground py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
          <button className="flex-1 bg-primary text-white py-3 rounded-lg font-medium hover:bg-blue-900 transition-colors">
            Download Report
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ReportDetailsPage() {
  return (
    <Suspense>
      <ReportDetailsContent />
    </Suspense>
  )
}
