-- CreateTable
CREATE TABLE "lesson_file_attachments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_file_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lesson_file_attachments_storageKey_key" ON "lesson_file_attachments"("storageKey");

-- CreateIndex
CREATE INDEX "lesson_file_attachments_tenantId_idx" ON "lesson_file_attachments"("tenantId");

-- CreateIndex
CREATE INDEX "lesson_file_attachments_lessonId_idx" ON "lesson_file_attachments"("lessonId");

-- CreateIndex
CREATE INDEX "lesson_file_attachments_tenantId_lessonId_idx" ON "lesson_file_attachments"("tenantId", "lessonId");

-- AddForeignKey
ALTER TABLE "lesson_file_attachments" ADD CONSTRAINT "lesson_file_attachments_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
