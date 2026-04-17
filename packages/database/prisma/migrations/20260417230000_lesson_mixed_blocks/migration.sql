-- Mixed lessons: add MIXED content kind and normalized `lesson_blocks` for ordered segments.
-- Migration strategy (existing rows): READING and VIDEO lessons are unchanged — they keep using
-- `lessons.content` / `lessons.videoAsset` only. `lesson_blocks` stays empty until staff sets
-- `contentKind = MIXED` and replaces blocks via the staff API. No automatic backfill.

-- CreateEnum
CREATE TYPE "LessonBlockType" AS ENUM ('READING', 'VIDEO');

-- AlterEnum
ALTER TYPE "LessonContentKind" ADD VALUE 'MIXED';

-- CreateTable
CREATE TABLE "lesson_blocks" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "blockType" "LessonBlockType" NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lesson_blocks_tenantId_idx" ON "lesson_blocks"("tenantId");

-- CreateIndex
CREATE INDEX "lesson_blocks_tenantId_lessonId_idx" ON "lesson_blocks"("tenantId", "lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_blocks_lessonId_sortOrder_key" ON "lesson_blocks"("lessonId", "sortOrder");

-- AddForeignKey
ALTER TABLE "lesson_blocks" ADD CONSTRAINT "lesson_blocks_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_blocks" ADD CONSTRAINT "lesson_blocks_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
