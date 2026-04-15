const MAX_SAMPLES = 1000;

let startedAt = Date.now();

type StatusBucket = "2xx" | "3xx" | "4xx" | "5xx" | "other";

const byStatusClass: Record<StatusBucket, number> = {
  "2xx": 0,
  "3xx": 0,
  "4xx": 0,
  "5xx": 0,
  other: 0
};

let totalRequests = 0;
let latencySumMs = 0;
let latencyMaxMs = 0;
const latencyRing: number[] = [];

function statusBucket(status: number): StatusBucket {
  if (status >= 200 && status < 300) {
    return "2xx";
  }
  if (status >= 300 && status < 400) {
    return "3xx";
  }
  if (status >= 400 && status < 500) {
    return "4xx";
  }
  if (status >= 500) {
    return "5xx";
  }
  return "other";
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) {
    return 0;
  }
  const rank = Math.ceil((p / 100) * sorted.length) - 1;
  const idx = Math.max(0, Math.min(rank, sorted.length - 1));
  return sorted[idx] ?? 0;
}

export function recordRequestLatency(status: number, durationMs: number): void {
  totalRequests += 1;
  byStatusClass[statusBucket(status)] += 1;
  latencySumMs += durationMs;
  latencyMaxMs = Math.max(latencyMaxMs, durationMs);
  latencyRing.push(durationMs);
  if (latencyRing.length > MAX_SAMPLES) {
    latencyRing.shift();
  }
}

export function getMetricsSnapshot(): {
  uptime_seconds: number;
  requests: { total: number; byStatusClass: Record<StatusBucket, number> };
  latencyMs: {
    avg: number;
    max: number;
    p50: number;
    p95: number;
    sampleSize: number;
  };
} {
  const sorted = [...latencyRing].sort((a, b) => a - b);
  return {
    uptime_seconds: Math.floor((Date.now() - startedAt) / 1000),
    requests: {
      total: totalRequests,
      byStatusClass: { ...byStatusClass }
    },
    latencyMs: {
      avg: totalRequests === 0 ? 0 : latencySumMs / totalRequests,
      max: latencyMaxMs,
      p50: percentile(sorted, 50),
      p95: percentile(sorted, 95),
      sampleSize: sorted.length
    }
  };
}

/** Test hook: reset process-local metrics between Vitest cases. */
export function resetMetricsForTests(): void {
  startedAt = Date.now();
  totalRequests = 0;
  latencySumMs = 0;
  latencyMaxMs = 0;
  latencyRing.length = 0;
  for (const key of Object.keys(byStatusClass) as StatusBucket[]) {
    byStatusClass[key] = 0;
  }
}
