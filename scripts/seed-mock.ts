import { MongoClient, ObjectId } from "mongodb";
import * as bcrypt from "bcryptjs";
import { faker } from "@faker-js/faker";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        process.env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
      }
    }
  }
}

const config: MockDataConfig = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "..", "mock-data-config.json"), "utf-8"),
);

type UserRole = "coordinator" | "facilitator" | "admin";
type UserStatus = "active" | "inactive";

type UserDocument = {
  username: string;
  usernameLower: string;
  email: string;
  emailLower: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  project?: string;
  profileImage?: string;
  createdAt: Date;
};

type DynamicReportField = {
  fieldId: string;
  label: string;
  type: "text" | "textarea" | "number" | "file" | "choice" | "date" | "rating";
  value: string | string[];
};

type ReportStatus =
  | "draft"
  | "submitted"
  | "approval-pending"
  | "approved"
  | "rejected";

type ReportDocument = {
  projectName: string;
  quarter: string;
  createdBy: ObjectId;
  createdByUsername: string;
  createdAt: Date;
  status: ReportStatus;
  fields: Record<string, string | string[]>;
  dynamicFields: DynamicReportField[];
};

type MockDataConfig = {
  users: { admins: number; coordinators: number; facilitators: number };
  reports: number;
  projects: string[];
  quarters: string[];
  emailPrefix: string;
  usernamePatterns: { admin: string; coordinator: string; facilitator: string };
  reportsPerUserRange: [number, number];
  years: number[];
};

const FIELD_TEMPLATES: Omit<DynamicReportField, "value">[] = [
  { fieldId: "f1", label: "Project Name", type: "text" },
  { fieldId: "f2", label: "Beneficiaries Reached", type: "number" },
  { fieldId: "f3", label: "Activities Conducted", type: "textarea" },
  { fieldId: "f4", label: "Budget Spent ($)", type: "number" },
  { fieldId: "f5", label: "Completion %", type: "rating" },
  { fieldId: "f6", label: "Challenges", type: "textarea" },
  { fieldId: "f7", label: "Key Achievements", type: "textarea" },
  { fieldId: "f8", label: "Next Steps", type: "textarea" },
  { fieldId: "f9", label: "Language", type: "choice" },
  { fieldId: "f10", label: "Review Status", type: "choice" },
];

const REPORT_STATUSES: ReportStatus[] = [
  "submitted",
  "submitted",
  "submitted",
  "approval-pending",
  "approved",
  "approved",
  "rejected",
  "draft",
];

const LANGUAGE_OPTIONS = ["English", "Spanish", "French", "Arabic"];

function generateFieldValue(
  template: Omit<DynamicReportField, "value">,
): string | string[] {
  switch (template.type) {
    case "number":
      return faker.number.int({ min: 50, max: 5000 }).toString();
    case "rating":
      return faker.number.int({ min: 1, max: 5 }).toString();
    case "choice":
      if (template.label === "Language") {
        return faker.helpers.arrayElement(LANGUAGE_OPTIONS);
      }
      return faker.helpers.arrayElement(["Yes", "No", "In Progress"]);
    case "date":
      return faker.date.past({ years: 1 }).toISOString().split("T")[0];
    case "text":
      return faker.lorem.words({ min: 2, max: 8 });
    case "textarea":
      return faker.lorem.paragraphs({ min: 1, max: 3 });
    default:
      return faker.lorem.words(3);
  }
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI not set. Check .env.local.");
    process.exit(1);
  }

  const dbName = process.env.MONGODB_DB_NAME || "quarterly_reports";
  const password = "password123";
  const commonPassword = await bcrypt.hash(password, 10);

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  const usersCollection = db.collection<UserDocument>("users");
  const reportsCollection = db.collection<ReportDocument>("reports");

  console.log("Connected to MongoDB:", dbName);
  console.log("");

  // ── Clear existing seed data ──────────────────────────
  console.log("Clearing existing users and reports...");
  await usersCollection.deleteMany({});
  await reportsCollection.deleteMany({});
  console.log("Done.");
  console.log("");

  // ── Build users ────────────────────────────────────────
  const { admins, coordinators, facilitators } = config.users;
  const projects = config.projects;
  const emailPrefix = config.emailPrefix;
  const patterns = config.usernamePatterns;

  interface UserWithMeta {
    doc: UserDocument;
    role: UserRole;
    project?: string;
  }

  const userMetas: UserWithMeta[] = [];

  // Admins
  for (let i = 1; i <= admins; i++) {
    const username = `${patterns.admin}${i}`;
    userMetas.push({
      doc: {
        username,
        usernameLower: username.toLowerCase(),
        email: `${emailPrefix}+a${i}@gmail.com`,
        emailLower: `${emailPrefix}+a${i}@gmail.com`.toLowerCase(),
        password: commonPassword,
        role: "admin",
        status: "active",
        createdAt: faker.date.between({ from: "2024-01-01", to: "2024-06-01" }),
      },
      role: "admin",
    });
  }

  // Coordinators
  for (let i = 1; i <= coordinators; i++) {
    const username = `${patterns.coordinator}${i}`;
    const project = projects[i % projects.length];
    userMetas.push({
      doc: {
        username,
        usernameLower: username.toLowerCase(),
        email: `${emailPrefix}+c${i}@gmail.com`,
        emailLower: `${emailPrefix}+c${i}@gmail.com`.toLowerCase(),
        password: commonPassword,
        role: "coordinator",
        status: "active",
        project,
        createdAt: faker.date.between({ from: "2024-01-01", to: "2024-12-01" }),
      },
      role: "coordinator",
      project,
    });
  }

  // Facilitators
  for (let i = 1; i <= facilitators; i++) {
    const username = `${patterns.facilitator}${i}`;
    const project = projects[(i + 3) % projects.length];
    userMetas.push({
      doc: {
        username,
        usernameLower: username.toLowerCase(),
        email: `${emailPrefix}+f${i}@gmail.com`,
        emailLower: `${emailPrefix}+f${i}@gmail.com`.toLowerCase(),
        password: commonPassword,
        role: "facilitator",
        status: "active",
        project,
        createdAt: faker.date.between({ from: "2024-01-01", to: "2024-12-01" }),
      },
      role: "facilitator",
      project,
    });
  }

  // Insert users and capture their generated _id values
  const insertResult = await usersCollection.insertMany(
    userMetas.map((m) => m.doc),
  );
  const userIds = Object.values(insertResult.insertedIds);

  console.log(`Inserted ${userMetas.length} users:`);
  console.log(`  Admins:       ${admins}`);
  console.log(`  Coordinators: ${coordinators}`);
  console.log(`  Facilitators: ${facilitators}`);
  console.log(`  Common password: "${password}"`);
  console.log("");

  // ── Build reports ─────────────────────────────────────
  const reportCount = config.reports;
  const quarters = config.quarters;
  const years = config.years;
  const [minReports, maxReports] = config.reportsPerUserRange;

  const reporters = userMetas
    .map((m, i) => ({ meta: m, userId: userIds[i] }))
    .filter(({ meta }) => meta.role !== "admin" && meta.project);

  const reportsToInsert: ReportDocument[] = [];

  faker.seed(42);

  while (reportsToInsert.length < reportCount && reporters.length > 0) {
    for (const { meta, userId } of reporters) {
      if (reportsToInsert.length >= reportCount) break;

      const reportsForThisUser = faker.number.int({ min: minReports, max: maxReports });

      for (let r = 0; r < reportsForThisUser; r++) {
        if (reportsToInsert.length >= reportCount) break;

        const year = faker.helpers.arrayElement(years);
        const quarter = faker.helpers.arrayElement(quarters);
        const quarterLabel = `${quarter} ${year}`;

        const dynamicFields: DynamicReportField[] = FIELD_TEMPLATES.map((t) => ({
          ...t,
          value: generateFieldValue(t),
        }));

        const fields: Record<string, string | string[]> = {};
        for (const df of dynamicFields) {
          fields[df.label] = df.value;
        }

        const createdAt = faker.date.between({
          from: new Date(year, quarterIndex(quarter) * 3, 1),
          to: new Date(year, quarterIndex(quarter) * 3 + 3, 0),
        });

        reportsToInsert.push({
          projectName: meta.project!,
          quarter: quarterLabel,
          createdBy: userId,
          createdByUsername: meta.doc.username,
          createdAt,
          status: faker.helpers.arrayElement(REPORT_STATUSES),
          fields,
          dynamicFields,
        });
      }
    }
  }

  await reportsCollection.insertMany(reportsToInsert);
  console.log(`Inserted ${reportsToInsert.length} reports`);
  console.log("");

  await client.close();
  console.log("Seed complete.");
  console.log("");
  console.log("─".repeat(40));
  console.log("Login credentials:");
  console.log(`  Password: "${password}"`);
  console.log(`  Admin example:      ${emailPrefix}+a1@gmail.com`);
  console.log(`  Coordinator example: ${emailPrefix}+c1@gmail.com`);
  console.log(`  Facilitator example: ${emailPrefix}+f1@gmail.com`);
  console.log("─".repeat(40));
}

function quarterIndex(q: string): number {
  const map: Record<string, number> = { Q1: 0, Q2: 1, Q3: 2, Q4: 3 };
  return map[q] ?? 0;
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
