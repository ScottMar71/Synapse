-- CreateTable
CREATE TABLE "lesson_watch_states" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "positionSec" DOUBLE PRECISION NOT NULL,
    "durationSec" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_watch_states_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lesson_watch_states_tenantId_userId_lessonId_key" ON "lesson_watch_states"("tenantId", "userId", "lessonId");

-- CreateIndex
CREATE INDEX "lesson_watch_states_tenantId_lessonId_idx" ON "lesson_watch_states"("tenantId", "lessonId");

-- AddForeignKey
ALTER TABLE "lesson_watch_states" ADD CONSTRAINT "lesson_watch_states_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lesson_watch_states" ADD CONSTRAINT "lesson_watch_states_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lesson_watch_states" ADD CONSTRAINT "lesson_watch_states_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
