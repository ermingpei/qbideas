-- CreateEnum
CREATE TYPE "idea_tier" AS ENUM ('regular', 'premium');

-- CreateEnum
CREATE TYPE "idea_source" AS ENUM ('ai', 'community');

-- CreateEnum
CREATE TYPE "service_request_status" AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "transaction_type" AS ENUM ('idea_unlock', 'service_purchase', 'contributor_earning', 'payout');

-- CreateEnum
CREATE TYPE "payout_status" AS ENUM ('pending', 'processing', 'completed', 'failed');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "profile_image_url" TEXT,
    "bio" TEXT,
    "reputation_score" INTEGER NOT NULL DEFAULT 0,
    "total_earnings" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "available_balance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "stripe_account_id" VARCHAR(255),
    "notification_preferences" JSONB NOT NULL DEFAULT '{"email": true, "inApp": true, "push": false}',

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ideas" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "teaser_description" TEXT NOT NULL,
    "full_description" TEXT NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "tier" "idea_tier" NOT NULL,
    "source" "idea_source" NOT NULL,
    "contributor_id" TEXT,
    "executive_summary" JSONB,
    "problem_statement" JSONB,
    "solution_overview" JSONB,
    "target_market" JSONB,
    "competitive_analysis" JSONB,
    "technical_architecture" JSONB,
    "go_to_market_strategy" JSONB,
    "financial_projections" JSONB,
    "risk_assessment" JSONB,
    "market_potential_score" DECIMAL(3,2) NOT NULL,
    "technical_feasibility_score" DECIMAL(3,2) NOT NULL,
    "innovation_score" DECIMAL(3,2) NOT NULL,
    "overall_score" DECIMAL(3,2) NOT NULL,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "comment_count" INTEGER NOT NULL DEFAULT 0,
    "unlock_count" INTEGER NOT NULL DEFAULT 0,
    "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_validated" BOOLEAN NOT NULL DEFAULT false,
    "unlock_price" DECIMAL(10,2) NOT NULL DEFAULT 9.99,

    CONSTRAINT "ideas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idea_unlocks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "idea_id" TEXT NOT NULL,
    "unlocked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payment_amount" DECIMAL(10,2) NOT NULL,
    "stripe_payment_intent_id" VARCHAR(255),

    CONSTRAINT "idea_unlocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "premium_services" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "delivery_time_days" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "premium_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_requests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "idea_id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "status" "service_request_status" NOT NULL,
    "payment_amount" DECIMAL(10,2) NOT NULL,
    "stripe_payment_intent_id" VARCHAR(255),
    "report_url" TEXT,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "deadline" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "transaction_type" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "description" TEXT,
    "reference_id" TEXT,
    "stripe_transaction_id" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payouts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "payout_status" NOT NULL,
    "stripe_payout_id" VARCHAR(255),
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "failure_reason" TEXT,

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "ideas_slug_key" ON "ideas"("slug");

-- CreateIndex
CREATE INDEX "ideas_tier_idx" ON "ideas"("tier");

-- CreateIndex
CREATE INDEX "ideas_category_idx" ON "ideas"("category");

-- CreateIndex
CREATE INDEX "ideas_published_at_idx" ON "ideas"("published_at" DESC);

-- CreateIndex
CREATE INDEX "ideas_contributor_id_idx" ON "ideas"("contributor_id");

-- CreateIndex
CREATE INDEX "ideas_overall_score_idx" ON "ideas"("overall_score" DESC);

-- CreateIndex
CREATE INDEX "idea_unlocks_user_id_idx" ON "idea_unlocks"("user_id");

-- CreateIndex
CREATE INDEX "idea_unlocks_idea_id_idx" ON "idea_unlocks"("idea_id");

-- CreateIndex
CREATE UNIQUE INDEX "idea_unlocks_user_id_idea_id_key" ON "idea_unlocks"("user_id", "idea_id");

-- CreateIndex
CREATE INDEX "service_requests_user_id_idx" ON "service_requests"("user_id");

-- CreateIndex
CREATE INDEX "service_requests_status_idx" ON "service_requests"("status");

-- CreateIndex
CREATE INDEX "service_requests_deadline_idx" ON "service_requests"("deadline");

-- CreateIndex
CREATE INDEX "transactions_user_id_idx" ON "transactions"("user_id");

-- CreateIndex
CREATE INDEX "transactions_type_idx" ON "transactions"("type");

-- CreateIndex
CREATE INDEX "transactions_created_at_idx" ON "transactions"("created_at" DESC);

-- CreateIndex
CREATE INDEX "payouts_user_id_idx" ON "payouts"("user_id");

-- CreateIndex
CREATE INDEX "payouts_status_idx" ON "payouts"("status");

-- AddForeignKey
ALTER TABLE "ideas" ADD CONSTRAINT "ideas_contributor_id_fkey" FOREIGN KEY ("contributor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idea_unlocks" ADD CONSTRAINT "idea_unlocks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idea_unlocks" ADD CONSTRAINT "idea_unlocks_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "ideas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "ideas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "premium_services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
