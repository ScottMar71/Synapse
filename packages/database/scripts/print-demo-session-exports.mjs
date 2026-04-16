/**
 * Prints shell exports for @conductor/web a11y spot audit (demo seed tenant).
 * Requires DATABASE_URL and prisma generate; run from repo root after migrate + seed.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.findUnique({ where: { slug: "demo-tenant" } });
  if (!tenant) {
    console.error('No tenant with slug "demo-tenant". Run: npm run db:seed --workspace=@conductor/database');
    process.exit(1);
  }
  const user = await prisma.user.findFirst({
    where: { tenantId: tenant.id, email: "admin@demo.local" },
  });
  if (!user) {
    console.error("No admin@demo.local user for demo tenant.");
    process.exit(1);
  }
  const course = await prisma.course.findFirst({
    where: { tenantId: tenant.id, code: "LMS-101" },
  });
  if (!course) {
    console.error('No course with code "LMS-101".');
    process.exit(1);
  }

  console.log("# Paste before: npm run a11y:spot-audit --workspace=@conductor/web");
  console.log(`export A11Y_TENANT_ID=${tenant.id}`);
  console.log(`export A11Y_USER_ID=${user.id}`);
  console.log(`export A11Y_COURSE_ID=${course.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
