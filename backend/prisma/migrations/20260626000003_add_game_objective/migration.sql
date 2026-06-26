-- AlterTable: add objective with a default so existing rows are not rejected
ALTER TABLE "games" ADD COLUMN "objective" TEXT NOT NULL DEFAULT '';

-- Remove the default so future inserts must provide a value
ALTER TABLE "games" ALTER COLUMN "objective" DROP DEFAULT;
