import type { LessonScormSessionDto } from "@conductor/contracts";

import { patchLessonScormSession, type LmsApiSession } from "../../../../../../lib/lms-api-client";

type Scorm12Api = {
  LMSInitialize: (param: string) => string;
  LMSFinish: (param: string) => string;
  LMSGetValue: (element: string) => string;
  LMSSetValue: (element: string, value: string) => string;
  LMSCommit: (param: string) => string;
  LMSGetLastError: () => string;
  LMSGetErrorString: (errorCode: string) => string;
  LMSGetDiagnostic: (errorCode: string) => string;
};

export type AttachScorm12ApiOptions = {
  session: LmsApiSession;
  courseId: string;
  lessonId: string;
  initialSession: LessonScormSessionDto;
  onSessionPersisted?: (session: LessonScormSessionDto) => void;
};

/**
 * Minimal SCORM 1.2 Runtime Environment (`window.API`) backed by LMS session PATCH.
 * Sufficient for packages that use `cmi.core.lesson_status` and related keys.
 */
export function attachScorm12ApiToWindow(options: AttachScorm12ApiOptions): () => void {
  const win = window as Window & { API?: Scorm12Api };
  let initialized = false;
  let lastError = "0";
  const cmi: Record<string, string> = { ...options.initialSession.cmiState };
  const dirty: Record<string, string> = {};
  let flushChain: Promise<void> = Promise.resolve();

  async function flush(): Promise<void> {
    const keys = Object.keys(dirty);
    if (keys.length === 0) {
      return;
    }
    const payload: Record<string, string | null> = {};
    for (const k of keys) {
      payload[k] = dirty[k];
    }
    for (const k of keys) {
      delete dirty[k];
    }
    const patch = await patchLessonScormSession(options.session, options.courseId, options.lessonId, {
      cmiState: payload
    });
    if (!patch.ok) {
      lastError = "101";
      return;
    }
    lastError = "0";
    Object.assign(cmi, patch.session.cmiState);
    options.onSessionPersisted?.(patch.session);
  }

  const api: Scorm12Api = {
    LMSInitialize(): string {
      if (initialized) {
        lastError = "101";
        return "false";
      }
      initialized = true;
      lastError = "0";
      return "true";
    },
    LMSFinish(): string {
      flushChain = flushChain.then(flush);
      initialized = false;
      lastError = "0";
      return "true";
    },
    LMSGetValue(element: string): string {
      if (!initialized) {
        lastError = "301";
        return "";
      }
      lastError = "0";
      return cmi[element] ?? "";
    },
    LMSSetValue(element: string, value: string): string {
      if (!initialized) {
        lastError = "301";
        return "false";
      }
      if (element.length === 0) {
        lastError = "351";
        return "false";
      }
      cmi[element] = value;
      dirty[element] = value;
      lastError = "0";
      return "true";
    },
    LMSCommit(): string {
      if (!initialized) {
        lastError = "301";
        return "false";
      }
      flushChain = flushChain.then(flush);
      lastError = "0";
      return "true";
    },
    LMSGetLastError(): string {
      return lastError;
    },
    LMSGetErrorString(errorCode: string): string {
      if (errorCode === "0") {
        return "No error";
      }
      if (errorCode === "101") {
        return "General exception";
      }
      if (errorCode === "301") {
        return "Not initialized";
      }
      if (errorCode === "351") {
        return "Invalid argument";
      }
      return "Error";
    },
    LMSGetDiagnostic(): string {
      return "";
    }
  };

  win.API = api;
  return () => {
    if (win.API === api) {
      delete win.API;
    }
  };
}
