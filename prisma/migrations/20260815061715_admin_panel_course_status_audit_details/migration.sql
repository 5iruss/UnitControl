-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "details" JSONB;

-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "status" "CurriculumStatus" NOT NULL DEFAULT 'ACTIVE';
