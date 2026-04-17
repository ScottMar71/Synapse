-- CreateTable
CREATE TABLE "lesson_glossary_entries" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "definition" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_glossary_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lesson_glossary_entries_tenantId_idx" ON "lesson_glossary_entries"("tenantId");

-- CreateIndex
CREATE INDEX "lesson_glossary_entries_lessonId_idx" ON "lesson_glossary_entries"("lessonId");

-- CreateIndex
CREATE INDEX "lesson_glossary_entries_tenantId_lessonId_idx" ON "lesson_glossary_entries"("tenantId", "lessonId");

-- AddForeignKey
ALTER TABLE "lesson_glossary_entries" ADD CONSTRAINT "lesson_glossary_entries_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_glossary_entries" ADD CONSTRAINT "lesson_glossary_entries_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
