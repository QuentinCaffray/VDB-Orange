-- CreateEnum
CREATE TYPE "IndicatorType" AS ENUM ('daily', 'monthly');

-- AlterTable
ALTER TABLE "indicators" ADD COLUMN     "type" "IndicatorType" NOT NULL DEFAULT 'daily';
