-- DropForeignKey
ALTER TABLE "recurring_task_completions" DROP CONSTRAINT "recurring_task_completions_recurringTaskId_fkey";

-- DropForeignKey
ALTER TABLE "recurring_task_completions" DROP CONSTRAINT "recurring_task_completions_userId_fkey";

-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_createdById_fkey";

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "recurringTaskId" TEXT,
ALTER COLUMN "createdById" DROP NOT NULL;

-- DropTable
DROP TABLE "recurring_task_completions";

-- CreateIndex
CREATE UNIQUE INDEX "tasks_recurringTaskId_dueDate_key" ON "tasks"("recurringTaskId", "dueDate");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_recurringTaskId_fkey" FOREIGN KEY ("recurringTaskId") REFERENCES "recurring_tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
