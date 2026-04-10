export type AuthAdapter = {
  validateToken: (token: string) => Promise<{ userId: string } | null>;
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

export type PlatformAdapters = {
  auth: AuthAdapter;
  storage: StorageAdapter;
  email: EmailAdapter;
  queue: QueueAdapter;
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
    }
  };
}
