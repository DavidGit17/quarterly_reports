export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const { getAgenda } = await import("@/server/agenda/config");
      const { defineWorkers } = await import("@/server/agenda/worker");
      const agenda = await getAgenda();
      await defineWorkers(agenda);
      await agenda.start();
      console.log("[INSTRUMENTATION] Agenda workers registered and started.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[INSTRUMENTATION] Failed to initialize Agenda:", message);
    }
  }
}
