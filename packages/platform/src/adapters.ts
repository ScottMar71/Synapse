export type AuthAdapter = {
  validateToken: (token: string) => Promise<{ userId: string; tenantId: string } | null>;
};

export type StorageAdapter = {
  putObject: (input: { key: string; body: string }) => Promise<void>;
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
