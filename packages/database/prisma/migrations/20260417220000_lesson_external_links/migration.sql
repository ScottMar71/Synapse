-- CreateTable
CREATE TABLE "lesson_external_links" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_external_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lesson_external_links_tenantId_idx" ON "lesson_external_links"("tenantId");

-- CreateIndex
CREATE INDEX "lesson_external_links_lessonId_idx" ON "lesson_external_links"("lessonId");

-- CreateIndex
CREATE INDEX "lesson_external_links_tenantId_lessonId_idx" ON "lesson_external_links"("tenantId", "lessonId");

-- AddForeignKey
ALTER TABLE "lesson_external_links" ADD CONSTRAINT "lesson_external_links_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_external_links" ADD CONSTRAINT "lesson_external_links_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
