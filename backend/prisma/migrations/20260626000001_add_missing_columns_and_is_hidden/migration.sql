-- DropForeignKey
ALTER TABLE "daily_sales" DROP CONSTRAINT "daily_sales_indicatorId_fkey";

-- DropForeignKey
ALTER TABLE "monthly_targets" DROP CONSTRAINT "monthly_targets_indicatorId_fkey";

-- DropIndex
DROP INDEX "daily_sales_date_userId_indicatorId_key";

-- AlterTable
ALTER TABLE "daily_sales" ADD COLUMN     "isCorrection" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "count" SET DEFAULT 0,
ALTER COLUMN "count" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "monthly_targets" ALTER COLUMN "target" SET DEFAULT 0,
ALTER COLUMN "target" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "dueDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "team_notes" DROP COLUMN "challengeCurrent",
DROP COLUMN "challengeLabel",
DROP COLUMN "challengeTarget";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isHidden" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastLoginAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "team_challenges" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "current" TEXT NOT NULL DEFAULT '0',
    "target" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_sales_date_userId_indicatorId_isCorrection_key" ON "daily_sales"("date", "userId", "indicatorId", "isCorrection");

-- AddForeignKey
ALTER TABLE "daily_sales" ADD CONSTRAINT "daily_sales_indicatorId_fkey" FOREIGN KEY ("indicatorId") REFERENCES "indicators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_targets" ADD CONSTRAINT "monthly_targets_indicatorId_fkey" FOREIGN KEY ("indicatorId") REFERENCES "indicators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_challenges" ADD CONSTRAINT "team_challenges_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "team_notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
