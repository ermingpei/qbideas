import { prisma } from '../index';
import logger from '../utils/logger';
import { Decimal } from '@prisma/client/runtime/library';

interface UnlockRevenueResult {
  success: boolean;
  contributorShare: number;
  platformShare: number;
  transactionId: string;
}

class RevenueService {
  private readonly CONTRIBUTOR_SHARE = 0.60; // 60% to contributor
  private readonly PLATFORM_SHARE = 0.40;    // 40% to platform
  private readonly REPUTATION_POINTS_PER_UNLOCK = 10;

  /**
   * Process revenue allocation when a premium idea is unlocked
   */
  async processIdeaUnlock(
    userId: string,
    ideaId: string,
    paymentAmount: number,
    stripePaymentIntentId?: string
  ): Promise<UnlockRevenueResult> {
    try {
      // Fetch idea with contributor info
      const idea = await prisma.ideas.findUnique({
        where: { id: ideaId },
        include: { contributor: true },
      });

      if (!idea) {
        throw new Error('Idea not found');
      }

      // Create unlock record
      const unlock = await prisma.ideaUnlocks.create({
        data: {
          userId,
          ideaId,
          paymentAmount,
          stripePaymentIntentId: stripePaymentIntentId ?? null,
        },
      });

      // Update idea metrics
      await prisma.ideas.update({
        where: { id: ideaId },
        data: { unlockCount: { increment: 1 } },
      });

      // Create transaction for the user who unlocked
      await prisma.transactions.create({
        data: {
          userId,
          type: 'idea_unlock',
          amount: -paymentAmount, // Negative for expense
          description: `Unlocked idea: ${idea.title}`,
          referenceId: ideaId,
          stripeTransactionId: stripePaymentIntentId ?? null,
        },
      });

      let contributorShare = 0;
      let platformShare = paymentAmount;

      // If community idea, allocate revenue to contributor
      if (idea.source === 'community' && idea.contributorId) {
        contributorShare = paymentAmount * this.CONTRIBUTOR_SHARE;
        platformShare = paymentAmount * this.PLATFORM_SHARE;

        // Update contributor balance and earnings
        await prisma.user.update({
          where: { id: idea.contributorId },
          data: {
            totalEarnings: { increment: contributorShare },
            availableBalance: { increment: contributorShare },
            reputationScore: { increment: this.REPUTATION_POINTS_PER_UNLOCK },
          },
        });

        // Record transaction for contributor
        const transaction = await prisma.transactions.create({
          data: {
            userId: idea.contributorId,
            type: 'contributor_earning',
            amount: contributorShare,
            description: `Earned from idea unlock: ${idea.title}`,
            referenceId: ideaId,
            stripeTransactionId: stripePaymentIntentId ?? null,
          },
        });

        logger.info(`Revenue allocated for idea ${ideaId}: Contributor ${contributorShare}, Platform ${platformShare}`);

        // TODO: Send notification to contributor
        // await this.notifyContributor(idea.contributorId, {
        //   type: 'earning_received',
        //   amount: contributorShare,
        //   ideaTitle: idea.title,
        // });

        return {
          success: true,
          contributorShare,
          platformShare,
          transactionId: transaction.id,
        };
      }

      logger.info(`AI idea unlocked ${ideaId}: Platform revenue ${platformShare}`);

      return {
        success: true,
        contributorShare: 0,
        platformShare,
        transactionId: unlock.id,
      };
    } catch (error) {
      logger.error('Error processing idea unlock revenue:', error);
      throw error;
    }
  }

  /**
   * Get earnings summary for a contributor
   */
  async getContributorEarnings(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          totalEarnings: true,
          availableBalance: true,
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Get transaction history
      const transactions = await prisma.transactions.findMany({
        where: {
          userId,
          type: { in: ['contributor_earning', 'payout'] },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      // Get payout history
      const payouts = await prisma.payouts.findMany({
        where: { userId },
        orderBy: { requestedAt: 'desc' },
        take: 20,
      });

      // Calculate pending balance (payouts in progress)
      const pendingPayouts = await prisma.payouts.aggregate({
        where: {
          userId,
          status: { in: ['pending', 'processing'] },
        },
        _sum: { amount: true },
      });

      const pendingBalance = Number(pendingPayouts._sum.amount || 0);

      return {
        totalEarnings: Number(user.totalEarnings),
        availableBalance: Number(user.availableBalance),
        pendingBalance,
        transactions: transactions.map(t => ({
          id: t.id,
          type: t.type,
          amount: Number(t.amount),
          description: t.description,
          createdAt: t.createdAt,
        })),
        payouts: payouts.map(p => ({
          id: p.id,
          amount: Number(p.amount),
          status: p.status,
          requestedAt: p.requestedAt,
          completedAt: p.completedAt,
          failureReason: p.failureReason,
        })),
      };
    } catch (error) {
      logger.error('Error fetching contributor earnings:', error);
      throw error;
    }
  }

  /**
   * Calculate revenue split for service purchases (future feature)
   */
  async processServicePurchase(
    userId: string,
    ideaId: string,
    serviceAmount: number,
    stripePaymentIntentId?: string
  ): Promise<UnlockRevenueResult> {
    try {
      const idea = await prisma.ideas.findUnique({
        where: { id: ideaId },
        include: { contributor: true },
      });

      if (!idea) {
        throw new Error('Idea not found');
      }

      // For services: 30% to contributor, 70% to platform
      const CONTRIBUTOR_SERVICE_SHARE = 0.30;
      const PLATFORM_SERVICE_SHARE = 0.70;

      let contributorShare = 0;
      let platformShare = serviceAmount;

      if (idea.source === 'community' && idea.contributorId) {
        contributorShare = serviceAmount * CONTRIBUTOR_SERVICE_SHARE;
        platformShare = serviceAmount * PLATFORM_SERVICE_SHARE;

        await prisma.user.update({
          where: { id: idea.contributorId },
          data: {
            totalEarnings: { increment: contributorShare },
            availableBalance: { increment: contributorShare },
            reputationScore: { increment: 25 }, // +25 for service purchase
          },
        });

        const transaction = await prisma.transactions.create({
          data: {
            userId: idea.contributorId,
            type: 'contributor_earning',
            amount: contributorShare,
            description: `Earned from service purchase for: ${idea.title}`,
            referenceId: ideaId,
            stripeTransactionId: stripePaymentIntentId ?? null,
          },
        });

        logger.info(`Service revenue allocated for idea ${ideaId}: Contributor ${contributorShare}, Platform ${platformShare}`);

        return {
          success: true,
          contributorShare,
          platformShare,
          transactionId: transaction.id,
        };
      }

      return {
        success: true,
        contributorShare: 0,
        platformShare,
        transactionId: '',
      };
    } catch (error) {
      logger.error('Error processing service purchase revenue:', error);
      throw error;
    }
  }
}

export const revenueService = new RevenueService();
