-- AlterTable
ALTER TABLE "curricula" ALTER COLUMN "entry_year_from" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "curricula_name_key" ON "curricula"("name");

