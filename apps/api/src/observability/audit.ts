import { getRequestId } from "./request-context.js";

export function emitAuditEvent(input: {
  action: string;
  actorUserId: string;
  tenantId: string;
  resource?: Record<string, unknown>;
}): void {
  const requestId = getRequestId();
  const line = JSON.stringify({
    type: "audit",
    action: input.action,
    actorUserId: input.actorUserId,
    tenantId: input.tenantId,
    ...(requestId ? { requestId } : {}),
    ...(input.resource ? { resource: input.resource } : {}),
    ts: new Date().toISOString()
  });
  process.stdout.write(`${line}\n`);
}
