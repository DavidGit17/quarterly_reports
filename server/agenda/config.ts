import type { Agenda as AgendaType } from "agenda";

const MONGO_URI = process.env.MONGODB_URI;

let agendaInstance: AgendaType | null = null;

export const getAgenda = async (): Promise<AgendaType> => {
  if (agendaInstance) {
    return agendaInstance;
  }

  if (!MONGO_URI) {
    throw new Error("Missing MONGODB_URI environment variable for Agenda");
  }

  const { Agenda } = await import("agenda");
  const dbName = process.env.MONGODB_DB_NAME || "quarterly_reports";

  agendaInstance = new Agenda({
    db: { address: `${MONGO_URI}/${dbName}`, collection: "agenda_jobs" },
    maxConcurrency: 5,
    defaultConcurrency: 1,
    defaultLockLifetime: 10 * 60 * 1000,
  });

  agendaInstance.on("ready", () => {
    console.log("[AGENDA] Initialized successfully. Connected to MongoDB.");
  });

  agendaInstance.on("error", (err: Error) => {
    console.error("[AGENDA] Error:", err);
  });

  return agendaInstance;
};

export const gracefulShutdown = async (): Promise<void> => {
  if (agendaInstance) {
    await agendaInstance.stop();
    console.log("[AGENDA] Stopped gracefully.");
  }
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);
