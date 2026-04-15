export type LmsPortal = "learn" | "instructor";

export type LmsSession = {
  tenantId: string;
  userId: string;
  token: string;
  portal: LmsPortal;
};

const STORAGE_KEY = "lms_session";

const MAX_COOKIE_AGE = 60 * 60 * 24 * 7;

function syncCookies(session: LmsSession): void {
  const secure = typeof window !== "undefined" && window.location.protocol === "https:";
  const suffix = `Path=/; Max-Age=${MAX_COOKIE_AGE}; SameSite=Lax${secure ? "; Secure" : ""}`;
  document.cookie = `lms_token=${encodeURIComponent(session.token)}; ${suffix}`;
  document.cookie = `lms_tenant=${encodeURIComponent(session.tenantId)}; ${suffix}`;
}

export function getSession(): LmsSession | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as LmsSession;
    if (
      typeof parsed.tenantId === "string" &&
      typeof parsed.userId === "string" &&
      typeof parsed.token === "string" &&
      (parsed.portal === "learn" || parsed.portal === "instructor")
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function setSession(session: LmsSession): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  syncCookies(session);
}

export function clearSession(): void {
  window.localStorage.removeItem(STORAGE_KEY);
  document.cookie = "lms_token=; Path=/; Max-Age=0";
  document.cookie = "lms_tenant=; Path=/; Max-Age=0";
}
