/**
 * Spot accessibility audit (axe-core via Playwright) for learner course + quiz shell and admin learners table.
 *
 * Prerequisites: API + web dev servers, seeded demo tenant (see @conductor/database db:seed).
 *
 *   npm run db:print-a11y-session --workspace=@conductor/database
 *   export A11Y_BASE_URL=http://localhost:3000   # optional
 *   npm run a11y:spot-audit --workspace=@conductor/web
 */
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";

function buildDevToken(tenantId, userId) {
  return `dev|${tenantId}|${userId}`;
}

function severityRank(impact) {
  const order = { critical: 0, serious: 1, moderate: 2, minor: 3 };
  return order[impact] ?? 4;
}

async function main() {
  const baseUrl = (process.env.A11Y_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const tenantId = process.env.A11Y_TENANT_ID;
  const userId = process.env.A11Y_USER_ID;
  const courseId = process.env.A11Y_COURSE_ID;

  if (!tenantId || !userId || !courseId) {
    console.error(
      "Missing env: A11Y_TENANT_ID, A11Y_USER_ID, A11Y_COURSE_ID.\n" +
        "Generate from a seeded DB: npm run db:print-a11y-session --workspace=@conductor/database",
    );
    process.exit(1);
  }

  const token = buildDevToken(tenantId, userId);

  const routes = [
    {
      id: "learner-course-lesson-and-quiz",
      path: `/learn/courses/${encodeURIComponent(courseId)}`,
      note: "Course view: outline (lesson context), progress, QuizShell assessment panel.",
    },
    {
      id: "admin-learners-table",
      path: "/admin/learners",
      note: "Admin directory: DataTable (cards <768px, table ≥768px).",
    },
  ];

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  await context.addCookies([
    { name: "lms_token", value: token, url: baseUrl },
    { name: "lms_tenant", value: tenantId, url: baseUrl },
  ]);

  let exitCode = 0;
  const summary = [];

  try {
    for (const route of routes) {
      const page = await context.newPage();
      const fullUrl = `${baseUrl}${route.path}`;
      await page.goto(fullUrl, { waitUntil: "networkidle", timeout: 60_000 });

      const results = await new AxeBuilder({ page }).analyze();
      const blocking = results.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
      blocking.sort((a, b) => severityRank(a.impact) - severityRank(b.impact));

      summary.push({
        route: route.id,
        url: fullUrl,
        note: route.note,
        tool: `axe-core ${results.testEngine?.version ?? "?"} via @axe-core/playwright`,
        violationsTotal: results.violations.length,
        criticalSerious: blocking.length,
        items: blocking.map((v) => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          nodes: v.nodes.length,
        })),
      });

      if (blocking.length > 0) {
        exitCode = 1;
        console.error(`\n[${route.id}] ${blocking.length} critical/serious issue(s) at ${fullUrl}`);
        for (const v of blocking) {
          console.error(`  - [${v.impact}] ${v.id}: ${v.help}`);
          for (const n of v.nodes.slice(0, 3)) {
            console.error(`    ${n.html?.slice(0, 120) ?? ""}`);
          }
          if (v.nodes.length > 3) {
            console.error(`    … +${v.nodes.length - 3} more nodes`);
          }
        }
      } else {
        console.error(`\n[${route.id}] OK (no critical/serious) — ${fullUrl}`);
      }

      await page.close();
    }
  } finally {
    await browser.close();
  }

  console.log("\n--- JSON summary (for PR / completion report) ---");
  console.log(JSON.stringify({ baseUrl, tool: "axe-core + Playwright", routes: summary }, null, 2));

  process.exit(exitCode);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
