export interface Coordinator {
  id: string;
  name: string;
  email: string;
  phone: string;
  projects: number;
  role: string;
  status: "active" | "inactive";
  joinDate: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  languages: string[];
  coordinators: number;
  status: "active" | "inactive" | "pending";
  createdDate: string;
}

export interface ActiveSession {
  project: string;
  language: string;
  quarter: string;
  coordinator: string;
  status: "filling";
  lastActivity: string;
}

export interface Report {
  id: string;
  projectId: string;
  projectName: string;
  language: string;
  quarter: string;
  submittedBy: string;
  status: "draft" | "submitted" | "approval-pending" | "approved";
  submissionDate: string;
}

export interface FormQuestion {
  id: string;
  label: string;
  type:
    | "text"
    | "textarea"
    | "dropdown"
    | "checkbox"
    | "multi-select"
    | "file"
    | "date"
    | "number";
  placeholder?: string;
  options?: string[];
  required: boolean;
  order: number;
}

export const mockCoordinators: Coordinator[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah.johnson@company.com",
    phone: "+1 (555) 123-4567",
    projects: 3,
    role: "Senior Coordinator",
    status: "active",
    joinDate: "2023-01-15",
  },
  {
    id: "2",
    name: "Michael Chen",
    email: "michael.chen@company.com",
    phone: "+1 (555) 234-5678",
    projects: 2,
    role: "Coordinator",
    status: "active",
    joinDate: "2023-03-20",
  },
  {
    id: "3",
    name: "Emma Williams",
    email: "emma.williams@company.com",
    phone: "+1 (555) 345-6789",
    projects: 1,
    role: "Junior Coordinator",
    status: "active",
    joinDate: "2024-01-10",
  },
  {
    id: "4",
    name: "David Brown",
    email: "david.brown@company.com",
    phone: "+1 (555) 456-7890",
    projects: 2,
    role: "Coordinator",
    status: "inactive",
    joinDate: "2022-06-05",
  },
];

const BIBLE_CHAPTERS = [
  "Genesis",
  "Exodus",
  "Matthew",
  "Romans",
  "Psalms",
  "Isaiah",
  "John",
  "Luke",
  "Acts",
  "Revelation",
];

export const mockProjects: Project[] = [
  {
    id: "proj-001",
    name: "Hiba",
    description:
      "Quarterly translation progress and field reporting for Hiba project",
    languages: BIBLE_CHAPTERS,
    coordinators: 3,
    status: "active",
    createdDate: "2023-09-01",
  },
  {
    id: "proj-002",
    name: "SuViMung",
    description:
      "Quarterly translation progress and field reporting for SuViMung project",
    languages: BIBLE_CHAPTERS,
    coordinators: 2,
    status: "active",
    createdDate: "2023-11-15",
  },
  {
    id: "proj-003",
    name: "Murna",
    description:
      "Quarterly translation progress and field reporting for Murna project",
    languages: BIBLE_CHAPTERS,
    coordinators: 4,
    status: "active",
    createdDate: "2024-01-08",
  },
  {
    id: "proj-004",
    name: "Ninjay",
    description:
      "Quarterly translation progress and field reporting for Ninjay project",
    languages: BIBLE_CHAPTERS,
    coordinators: 2,
    status: "active",
    createdDate: "2024-02-20",
  },
  {
    id: "proj-005",
    name: "Tunas",
    description:
      "Quarterly translation progress and field reporting for Tunas project",
    languages: BIBLE_CHAPTERS,
    coordinators: 1,
    status: "active",
    createdDate: "2023-07-10",
  },
];

export const mockReports: Report[] = [
  {
    id: "RPT-2024-001",
    projectId: "proj-001",
    projectName: "Hiba",
    language: "Romans",
    quarter: "Q1 2024",
    submittedBy: "Sarah Johnson",
    status: "approved",
    submissionDate: "2024-02-15",
  },
  {
    id: "RPT-2024-002",
    projectId: "proj-001",
    projectName: "Hiba",
    language: "Genesis",
    quarter: "Q1 2024",
    submittedBy: "Miguel Rodriguez",
    status: "approval-pending",
    submissionDate: "2024-02-18",
  },
  {
    id: "RPT-2024-003",
    projectId: "proj-002",
    projectName: "SuViMung",
    language: "Matthew",
    quarter: "Q1 2024",
    submittedBy: "Michael Chen",
    status: "draft",
    submissionDate: "2024-02-20",
  },
  {
    id: "RPT-2024-004",
    projectId: "proj-003",
    projectName: "Murna",
    language: "Exodus",
    quarter: "Q1 2024",
    submittedBy: "Emma Williams",
    status: "approved",
    submissionDate: "2024-02-14",
  },
  {
    id: "RPT-2024-005",
    projectId: "proj-001",
    projectName: "Hiba",
    language: "Psalms",
    quarter: "Q2 2024",
    submittedBy: "Pierre Dubois",
    status: "approval-pending",
    submissionDate: "2024-02-19",
  },
];

export const mockActiveSessions: ActiveSession[] = [
  {
    project: "Hiba",
    language: "Romans",
    quarter: "Q2 2024",
    coordinator: "Sarah Johnson",
    status: "filling",
    lastActivity: "2 mins ago",
  },
  {
    project: "SuViMung",
    language: "Matthew",
    quarter: "Q2 2024",
    coordinator: "Michael Chen",
    status: "filling",
    lastActivity: "5 mins ago",
  },
  {
    project: "Murna",
    language: "Exodus",
    quarter: "Q2 2024",
    coordinator: "Emma Williams",
    status: "filling",
    lastActivity: "1 min ago",
  },
];

export const mockFormQuestions: FormQuestion[] = [
  {
    id: "q-1",
    label: "Report Title",
    type: "text",
    placeholder: "Enter report title",
    required: true,
    order: 1,
  },
  {
    id: "q-2",
    label: "Executive Summary",
    type: "textarea",
    placeholder: "Provide a comprehensive summary of the report",
    required: true,
    order: 2,
  },
  {
    id: "q-3",
    label: "Report Quarter",
    type: "dropdown",
    options: ["Q1", "Q2", "Q3", "Q4"],
    required: true,
    order: 3,
  },
  {
    id: "q-4",
    label: "Key Achievements",
    type: "checkbox",
    options: [
      "Revenue Growth",
      "Market Expansion",
      "Product Launch",
      "Cost Reduction",
      "Customer Satisfaction",
    ],
    required: false,
    order: 4,
  },
  {
    id: "q-5",
    label: "Report Date",
    type: "date",
    required: true,
    order: 5,
  },
];
