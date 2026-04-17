export type AuthAdapter = {
  validateToken: (token: string) => Promise<{ userId: string; tenantId: string } | null>;
};

export type PresignedPutObjectResult = {
  url: string;
  headers: Record<string, string>;
};

export type PresignedGetObjectResult = {
  url: string;
  expiresInSeconds: number;
};

export type StorageAdapter = {
  putObject: (input: { key: string; body: string }) => Promise<void>;
  createPresignedPutObjectUrl: (input: {
    key: string;
    contentType: string;
    contentLength: number;
  }) => Promise<PresignedPutObjectResult>;
  createPresignedGetObjectUrl: (input: {
    key: string;
    fileName: string;
    contentType: string;
  }) => Promise<PresignedGetObjectResult>;
};

export type EmailAdapter = {
  sendEmail: (input: { to: string; subject: string; body: string }) => Promise<void>;
};

export type QueueAdapter = {
  enqueue: (input: { topic: string; payload: string }) => Promise<void>;
};

/** Deferred or asynchronous background work (distinct from message queue fan-out). */
export type JobsAdapter = {
  enqueueJob: (input: { jobName: string; payload: string }) => Promise<void>;
};

export type PlatformAdapters = {
  auth: AuthAdapter;
  storage: StorageAdapter;
  email: EmailAdapter;
  queue: QueueAdapter;
  jobs: JobsAdapter;
};

export function createNoopPlatformAdapters(): PlatformAdapters {
  return {
    auth: {
      async validateToken() {
        return null;
      }
    },
    storage: {
      async putObject() {
        return;
      },
      async createPresignedPutObjectUrl() {
        return { url: "https://example.invalid/presigned-put", headers: {} };
      },
      async createPresignedGetObjectUrl() {
        return { url: "https://example.invalid/presigned-get", expiresInSeconds: 60 };
      }
    },
    email: {
      async sendEmail() {
        return;
      }
    },
    queue: {
      async enqueue() {
        return;
      }
    },
    jobs: {
      async enqueueJob() {
        return;
      }
    }
  };
}

/** Merge overrides onto a base set so tests and apps can swap one seam without re-listing every adapter. */
export function mergePlatformAdapters(
  base: PlatformAdapters,
  override: Partial<PlatformAdapters>
): PlatformAdapters {
  return {
    auth: override.auth ?? base.auth,
    storage: override.storage ?? base.storage,
    email: override.email ?? base.email,
    queue: override.queue ?? base.queue,
    jobs: override.jobs ?? base.jobs
  };
}
