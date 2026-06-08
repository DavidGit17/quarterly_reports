type LogLevel = "info" | "warn" | "error" | "debug";

type LogEntry = {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  data?: unknown;
};

const log = (level: LogLevel, module: string, message: string, data?: unknown) => {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    module,
    message,
  };
  if (data !== undefined) {
    entry.data = data;
  }
  const line = JSON.stringify(entry);
  switch (level) {
    case "error":
      console.error(line);
      break;
    case "warn":
      console.warn(line);
      break;
    default:
      console.log(line);
  }
};

export const logger = {
  info: (module: string, message: string, data?: unknown) => log("info", module, message, data),
  warn: (module: string, message: string, data?: unknown) => log("warn", module, message, data),
  error: (module: string, message: string, data?: unknown) => log("error", module, message, data),
  debug: (module: string, message: string, data?: unknown) => log("debug", module, message, data),
};
