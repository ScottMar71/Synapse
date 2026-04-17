-- AlterEnum
ALTER TYPE "LessonContentKind" ADD VALUE 'SCORM';

-- CreateEnum
CREATE TYPE "LessonScormManifestProfile" AS ENUM ('SCORM_12', 'UNSUPPORTED_SCORM_2004');

-- CreateEnum
CREATE TYPE "LessonScormPackageStatus" AS ENUM ('PENDING_UPLOAD', 'PROCESSING', 'READY', 'FAILED');

-- CreateTable
CREATE TABLE "lesson_scorm_packages" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "zipStorageKey" TEXT NOT NULL,
    "extractedPrefix" TEXT NOT NULL,
    "title" TEXT,
    "originalFileName" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "status" "LessonScormPackageStatus" NOT NULL DEFAULT 'PENDING_UPLOAD',
    "processingError" TEXT,
    "manifestProfile" "LessonScormManifestProfile",
    "launchPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_scorm_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_scorm_attempts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "cmiState" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_scorm_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lesson_scorm_packages_lessonId_key" ON "lesson_scorm_packages"("lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_scorm_packages_zipStorageKey_key" ON "lesson_scorm_packages"("zipStorageKey");

-- CreateIndex
CREATE INDEX "lesson_scorm_packages_tenantId_idx" ON "lesson_scorm_packages"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_scorm_attempts_tenantId_userId_lessonId_key" ON "lesson_scorm_attempts"("tenantId", "userId", "lessonId");

-- CreateIndex
CREATE INDEX "lesson_scorm_attempts_tenantId_lessonId_idx" ON "lesson_scorm_attempts"("tenantId", "lessonId");

-- AddForeignKey
ALTER TABLE "lesson_scorm_packages" ADD CONSTRAINT "lesson_scorm_packages_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_scorm_attempts" ADD CONSTRAINT "lesson_scorm_attempts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_scorm_attempts" ADD CONSTRAINT "lesson_scorm_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_scorm_attempts" ADD CONSTRAINT "lesson_scorm_attempts_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
