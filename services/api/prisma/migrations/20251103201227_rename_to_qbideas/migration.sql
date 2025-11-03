/*
  Warnings:

  - The values [service_purchase] on the enum `transaction_type` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `is_validated` on the `ideas` table. All the data in the column will be lost.
  - You are about to drop the `premium_services` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `service_requests` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `category` on the `ideas` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "idea_category" AS ENUM ('saas', 'mobile_app', 'web_app', 'chrome_extension', 'api_service', 'marketplace', 'productivity', 'social', 'ecommerce', 'fintech', 'healthtech', 'edtech', 'devtools', 'ai_ml', 'other');

-- CreateEnum
CREATE TYPE "subscription_tier" AS ENUM ('free', 'pro', 'team');

-- CreateEnum
CREATE TYPE "build_status" AS ENUM ('planning', 'in_progress', 'launched', 'paused', 'abandoned');

-- AlterEnum
BEGIN;
CREATE TYPE "transaction_type_new" AS ENUM ('idea_unlock', 'subscription', 'contributor_earning', 'payout');
ALTER TABLE "transactions" ALTER COLUMN "type" TYPE "transaction_type_new" USING ("type"::text::"transaction_type_new");
ALTER TYPE "transaction_type" RENAME TO "transaction_type_old";
ALTER TYPE "transaction_type_new" RENAME TO "transaction_type";
DROP TYPE "transaction_type_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "service_requests" DROP CONSTRAINT "service_requests_idea_id_fkey";

-- DropForeignKey
ALTER TABLE "service_requests" DROP CONSTRAINT "service_requests_service_id_fkey";

-- DropForeignKey
ALTER TABLE "service_requests" DROP CONSTRAINT "service_requests_user_id_fkey";

-- AlterTable
ALTER TABLE "ideas" DROP COLUMN "is_validated",
ADD COLUMN     "bookmark_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "build_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "difficulty_level" VARCHAR(20) NOT NULL DEFAULT 'intermediate',
ADD COLUMN     "estimated_cost" DECIMAL(10,2),
ADD COLUMN     "estimated_launch_time" INTEGER,
ADD COLUMN     "execution_playbook" JSONB,
ADD COLUMN     "featured_at" TIMESTAMP(3),
ADD COLUMN     "is_featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_published" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "recommended_services" JSONB,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
DROP COLUMN "category",
ADD COLUMN     "category" "idea_category" NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "stripe_customer_id" VARCHAR(255),
ADD COLUMN     "subscription_ends_at" TIMESTAMP(3),
ADD COLUMN     "subscription_status" VARCHAR(20) DEFAULT 'inactive',
ADD COLUMN     "subscription_tier" "subscription_tier" NOT NULL DEFAULT 'free',
ADD COLUMN     "technical_skill_level" VARCHAR(20) DEFAULT 'beginner';

-- DropTable
DROP TABLE "premium_services";

-- DropTable
DROP TABLE "service_requests";

-- DropEnum
DROP TYPE "service_request_status";

-- CreateTable
CREATE TABLE "idea_likes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "idea_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "idea_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idea_bookmarks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "idea_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "idea_bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idea_comments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "idea_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parent_id" TEXT,
    "is_edited" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "idea_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idea_builds" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "idea_id" TEXT NOT NULL,
    "status" "build_status" NOT NULL DEFAULT 'planning',
    "title" VARCHAR(255),
    "description" TEXT,
    "progress_percent" INTEGER NOT NULL DEFAULT 0,
    "repository_url" TEXT,
    "live_url" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "launched_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "idea_builds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idea_likes_idea_id_idx" ON "idea_likes"("idea_id");

-- CreateIndex
CREATE INDEX "idea_likes_user_id_idx" ON "idea_likes"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "idea_likes_user_id_idea_id_key" ON "idea_likes"("user_id", "idea_id");

-- CreateIndex
CREATE INDEX "idea_bookmarks_idea_id_idx" ON "idea_bookmarks"("idea_id");

-- CreateIndex
CREATE INDEX "idea_bookmarks_user_id_idx" ON "idea_bookmarks"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "idea_bookmarks_user_id_idea_id_key" ON "idea_bookmarks"("user_id", "idea_id");

-- CreateIndex
CREATE INDEX "idea_comments_idea_id_idx" ON "idea_comments"("idea_id");

-- CreateIndex
CREATE INDEX "idea_comments_user_id_idx" ON "idea_comments"("user_id");

-- CreateIndex
CREATE INDEX "idea_comments_parent_id_idx" ON "idea_comments"("parent_id");

-- CreateIndex
CREATE INDEX "idea_comments_created_at_idx" ON "idea_comments"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idea_builds_idea_id_idx" ON "idea_builds"("idea_id");

-- CreateIndex
CREATE INDEX "idea_builds_user_id_idx" ON "idea_builds"("user_id");

-- CreateIndex
CREATE INDEX "idea_builds_status_idx" ON "idea_builds"("status");

-- CreateIndex
CREATE INDEX "idea_builds_launched_at_idx" ON "idea_builds"("launched_at" DESC);

-- CreateIndex
CREATE INDEX "ideas_category_idx" ON "ideas"("category");

-- CreateIndex
CREATE INDEX "ideas_is_featured_featured_at_idx" ON "ideas"("is_featured", "featured_at" DESC);

-- CreateIndex
CREATE INDEX "ideas_like_count_idx" ON "ideas"("like_count" DESC);

-- CreateIndex
CREATE INDEX "ideas_build_count_idx" ON "ideas"("build_count" DESC);

-- CreateIndex
CREATE INDEX "users_subscription_tier_idx" ON "users"("subscription_tier");

-- AddForeignKey
ALTER TABLE "idea_likes" ADD CONSTRAINT "idea_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idea_likes" ADD CONSTRAINT "idea_likes_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "ideas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idea_bookmarks" ADD CONSTRAINT "idea_bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idea_bookmarks" ADD CONSTRAINT "idea_bookmarks_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "ideas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idea_comments" ADD CONSTRAINT "idea_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idea_comments" ADD CONSTRAINT "idea_comments_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "ideas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idea_comments" ADD CONSTRAINT "idea_comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "idea_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idea_builds" ADD CONSTRAINT "idea_builds_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idea_builds" ADD CONSTRAINT "idea_builds_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "ideas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
