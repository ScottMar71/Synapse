-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'CONSENT';
ALTER TYPE "AuditAction" ADD VALUE 'ERASURE';

-- CreateEnum
CREATE TYPE "LegalBasis" AS ENUM ('CONSENT', 'CONTRACT', 'LEGAL_OBLIGATION', 'LEGITIMATE_INTEREST');

-- CreateTable
CREATE TABLE "consent_records" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "legalBasis" "LegalBasis" NOT NULL,
    "policyVersion" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "source" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consent_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "consent_records_tenantId_userId_recordedAt_idx" ON "consent_records"("tenantId", "userId", "recordedAt");

-- CreateIndex
CREATE INDEX "consent_records_tenantId_legalBasis_recordedAt_idx" ON "consent_records"("tenantId", "legalBasis", "recordedAt");

-- AddForeignKey
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
