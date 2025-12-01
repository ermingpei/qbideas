-- AlterTable
ALTER TABLE "idea_comments" ADD COLUMN     "project_id" TEXT,
ALTER COLUMN "idea_id" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "idea_comments_project_id_idx" ON "idea_comments"("project_id");

-- AddForeignKey
ALTER TABLE "idea_comments" ADD CONSTRAINT "idea_comments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
