import { getDb } from "@/server/db/mongodb";
import { sendProjectFormEmail } from "@/server/email/brevo-email";
import type { Agenda as AgendaType, Job } from "agenda";

type SendProjectFormLinksData = {
  projectId: string;
  formUrl: string;
};

export const defineWorkers = async (agenda: AgendaType): Promise<void> => {
  agenda.define(
    "send-project-form-links",
    { priority: 10, concurrency: 2 },
    async (job: Job) => {
      const { projectId, formUrl } = job.attrs.data as SendProjectFormLinksData;

      if (!projectId || !formUrl) {
        throw new Error("Missing required job data: projectId and formUrl");
      }

      console.log(
        `[WORKER] Processing send-project-form-links for project: ${projectId}`,
      );

      const db = await getDb();
      const usersCollection = db.collection("users");

      const recipients = await usersCollection
        .find(
          {
            project: projectId,
            role: { $in: ["coordinator", "facilitator"] },
            status: "active",
          },
          { projection: { email: 1, _id: 0 } },
        )
        .toArray();

      const emails: string[] = [];
      for (const user of recipients) {
        if (user.email) {
          emails.push(user.email);
        }
      }

      if (emails.length === 0) {
        console.warn(
          `[WORKER] No active recipients found for project: ${projectId}`,
        );
        return;
      }

      console.log(
        `[WORKER] Sending project form links to ${emails.length} recipients for project: ${projectId}`,
      );

      const result = await sendProjectFormEmail(emails, formUrl);

      console.log(
        `[WORKER] Completed for project ${projectId}: ${result.sent} sent, ${result.failed} failed`,
      );

      if (result.failed > 0) {
        job.attrs.data = {
          ...job.attrs.data,
          sentCount: result.sent,
          failedCount: result.failed,
        };
      }
    },
  );
};
