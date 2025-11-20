-- AlterTable
ALTER TABLE "ideas" ADD COLUMN     "rejection_feedback" JSONB,
ADD COLUMN     "submission_status" VARCHAR(20) DEFAULT 'approved',
ADD COLUMN     "trending_score" DECIMAL(10,2) DEFAULT 0,
ADD COLUMN     "trending_score_updated_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "ideas_submission_status_idx" ON "ideas"("submission_status");

-- CreateIndex
CREATE INDEX "ideas_trending_score_idx" ON "ideas"("trending_score" DESC);

-- CreateIndex
CREATE INDEX "ideas_source_is_published_published_at_idx" ON "ideas"("source", "is_published", "published_at" DESC);
