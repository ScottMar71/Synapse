-- CreateEnum
CREATE TYPE "LessonContentKind" AS ENUM ('READING', 'VIDEO');

-- AlterTable
ALTER TABLE "lessons" ADD COLUMN "contentKind" "LessonContentKind" NOT NULL DEFAULT 'READING';
ALTER TABLE "lessons" ADD COLUMN "videoAsset" JSONB;
