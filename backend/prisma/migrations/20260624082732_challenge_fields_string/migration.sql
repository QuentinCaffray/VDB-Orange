-- AlterTable
ALTER TABLE "team_notes" ALTER COLUMN "challengeCurrent" SET DEFAULT '0',
ALTER COLUMN "challengeCurrent" SET DATA TYPE TEXT,
ALTER COLUMN "challengeTarget" SET DEFAULT '0',
ALTER COLUMN "challengeTarget" SET DATA TYPE TEXT;
