import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo-tenant" },
    update: { name: "Demo Tenant" },
    create: {
      slug: "demo-tenant",
      name: "Demo Tenant",
      description: "Seed tenant for LMS local smoke tests",
    },
  });

  const adminUser = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: "admin@demo.local",
      },
    },
    update: {
      displayName: "Demo Admin",
    },
    create: {
      tenantId: tenant.id,
      email: "admin@demo.local",
      displayName: "Demo Admin",
    },
  });

  await prisma.membership.upsert({
    where: {
      tenantId_userId_role: {
        tenantId: tenant.id,
        userId: adminUser.id,
        role: "ADMIN",
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      userId: adminUser.id,
      role: "ADMIN",
    },
  });

  const course = await prisma.course.upsert({
    where: {
      tenantId_code: {
        tenantId: tenant.id,
        code: "LMS-101",
      },
    },
    update: {
      title: "LMS Quickstart",
    },
    create: {
      tenantId: tenant.id,
      code: "LMS-101",
      title: "LMS Quickstart",
      description: "Core onboarding curriculum for first-value milestones.",
    },
  });

  const module = await prisma.module.upsert({
    where: {
      courseId_sortOrder: {
        courseId: course.id,
        sortOrder: 1,
      },
    },
    update: {
      title: "Platform Fundamentals",
    },
    create: {
      tenantId: tenant.id,
      courseId: course.id,
      title: "Platform Fundamentals",
      sortOrder: 1,
    },
  });

  const lesson = await prisma.lesson.upsert({
    where: {
      moduleId_sortOrder: {
        moduleId: module.id,
        sortOrder: 1,
      },
    },
    update: {
      title: "Navigation Basics",
    },
    create: {
      tenantId: tenant.id,
      moduleId: module.id,
      title: "Navigation Basics",
      content: "Learners discover dashboard, course view, and progress bar.",
      sortOrder: 1,
    },
  });

  await prisma.enrollment.upsert({
    where: {
      tenantId_courseId_userId: {
        tenantId: tenant.id,
        courseId: course.id,
        userId: adminUser.id,
      },
    },
    update: {
      status: "ACTIVE",
    },
    create: {
      tenantId: tenant.id,
      courseId: course.id,
      userId: adminUser.id,
      status: "ACTIVE",
    },
  });

  const assessment = await prisma.assessment.upsert({
    where: {
      tenantId_courseId_title: {
        tenantId: tenant.id,
        courseId: course.id,
        title: "Quickstart Checkpoint",
      },
    },
    update: {
      maxScore: 100,
    },
    create: {
      tenantId: tenant.id,
      courseId: course.id,
      title: "Quickstart Checkpoint",
      maxScore: 100,
      rubric: "Evaluate learner confidence navigating LMS core flows.",
    },
  });

  await prisma.submission.upsert({
    where: {
      tenantId_assessmentId_userId: {
        tenantId: tenant.id,
        assessmentId: assessment.id,
        userId: adminUser.id,
      },
    },
    update: {
      status: "GRADED",
      score: 90,
      gradedAt: new Date(),
    },
    create: {
      tenantId: tenant.id,
      assessmentId: assessment.id,
      userId: adminUser.id,
      status: "SUBMITTED",
      score: 90,
      submittedAt: new Date(),
      gradedAt: new Date(),
    },
  });

  await prisma.progress.upsert({
    where: {
      tenantId_userId_courseId_moduleId_lessonId_scope: {
        tenantId: tenant.id,
        userId: adminUser.id,
        courseId: course.id,
        moduleId: module.id,
        lessonId: lesson.id,
        scope: "LESSON",
      },
    },
    update: {
      percent: 100,
      completedAt: new Date(),
    },
    create: {
      tenantId: tenant.id,
      userId: adminUser.id,
      courseId: course.id,
      moduleId: module.id,
      lessonId: lesson.id,
      scope: "LESSON",
      percent: 100,
      completedAt: new Date(),
    },
  });

  await prisma.auditEvent.create({
    data: {
      tenantId: tenant.id,
      userId: adminUser.id,
      action: "CREATE",
      entityType: "course",
      entityId: course.id,
      metadata: {
        source: "seed",
        note: "initial demo course created",
      },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Database seed failed", error);
    await prisma.$disconnect();
    process.exit(1);
  });
