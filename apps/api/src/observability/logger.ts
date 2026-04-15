import { getRequestId } from "./request-context.js";

export type LogLevel = "debug" | "info" | "warn" | "error";

function writeLog(level: LogLevel, msg: string, fields: Record<string, unknown>): void {
  const requestId = getRequestId();
  const line = {
    level,
    msg,
    ...(requestId ? { requestId } : {}),
    ...fields,
    ts: new Date().toISOString()
  };
  process.stdout.write(`${JSON.stringify(line)}\n`);
}

export function logInfo(msg: string, fields: Record<string, unknown> = {}): void {
  writeLog("info", msg, fields);
}

export function logError(msg: string, fields: Record<string, unknown> = {}): void {
  writeLog("error", msg, fields);
}
