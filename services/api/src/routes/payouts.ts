import { Router, Response } from 'express';
import { prisma } from '../index';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { ErrorCodes } from '@qbideas/shared';
import logger from '../utils/logger';
import Stripe from 'stripe';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';

const router = Router();

// Initialize Stripe (will be undefined if not configured)
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })
  : null;

const MINIMUM_PAYOUT_AMOUNT = 50; // $50 minimum

/**
 * @swagger
 * /api/payouts/request:
 *   post:
 *     summary: Request a payout
 *     description: Request a payout of available balance to connected Stripe account
 *     tags: [Payouts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payout requested successfully
 *       400:
 *         description: Insufficient balance or validation error
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Payout processing failed
 */
router.post(
  '/request',
  authMiddleware as any,
  [body('amount').isFloat({ min: 10.0 })],
  validate,
  async (req: any, res: Response) => {
    const userId = req.user!.id;

    // Fetch user with balance info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        availableBalance: true,
        stripeAccountId: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404, ErrorCodes.USER_NOT_FOUND);
    }

    const availableBalance = Number(user.availableBalance);

    // Validate minimum balance
    if (availableBalance < MINIMUM_PAYOUT_AMOUNT) {
      throw new AppError(
        `Minimum payout amount is $${MINIMUM_PAYOUT_AMOUNT}. Your available balance is $${availableBalance.toFixed(2)}`,
        400,
        ErrorCodes.INSUFFICIENT_BALANCE
      );
    }

    // Check if Stripe account is connected
    if (!user.stripeAccountId) {
      throw new AppError(
        'Please connect your Stripe account before requesting a payout',
        400,
        ErrorCodes.STRIPE_ACCOUNT_NOT_CONNECTED
      );
    }

    // Create payout record
    const payout = await prisma.payouts.create({
      data: {
        userId,
        amount: availableBalance,
        status: 'pending',
      },
    });

    // Process with Stripe if configured
    if (stripe) {
      try {
        // Create Stripe transfer
        const transfer = await stripe.transfers.create({
          amount: Math.round(availableBalance * 100), // Convert to cents
          currency: 'usd',
          destination: user.stripeAccountId,
          description: `Payout for contributor earnings - ${user.username}`,
          metadata: {
            payoutId: payout.id,
            userId: user.id,
            userEmail: user.email,
          },
        });

        // Update payout status to completed
        await prisma.payouts.update({
          where: { id: payout.id },
          data: {
            status: 'completed',
            stripePayoutId: transfer.id,
            completedAt: new Date(),
          },
        });

        // Update user balance to zero
        await prisma.user.update({
          where: { id: userId },
          data: {
            availableBalance: 0,
          },
        });

        // Record transaction
        await prisma.transactions.create({
          data: {
            userId,
            type: 'payout',
            amount: -availableBalance, // Negative for withdrawal
            description: 'Payout to Stripe account',
            stripeTransactionId: transfer.id,
            referenceId: payout.id,
          },
        });

        logger.info(`Payout completed for user ${userId}: $${availableBalance}`);

        res.json({
          success: true,
          data: {
            payoutId: payout.id,
            amount: availableBalance,
            status: 'completed',
            stripeTransferId: transfer.id,
            completedAt: new Date(),
          },
          message: `Payout of $${availableBalance.toFixed(2)} has been processed successfully`,
        });
      } catch (error: any) {
        // Update payout status to failed
        await prisma.payouts.update({
          where: { id: payout.id },
          data: {
            status: 'failed',
            failureReason: error.message || 'Stripe transfer failed',
          },
        });

        logger.error(`Payout failed for user ${userId}:`, error);

        throw new AppError(
          `Payout processing failed: ${error.message}`,
          500,
          ErrorCodes.PAYOUT_FAILED
        );
      }
    } else {
      // Stripe not configured - simulate success for development
      logger.warn('Stripe not configured - simulating payout success');

      await prisma.payouts.update({
        where: { id: payout.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
        },
      });

      await prisma.user.update({
        where: { id: userId },
        data: {
          availableBalance: 0,
        },
      });

      await prisma.transactions.create({
        data: {
          userId,
          type: 'payout',
          amount: -availableBalance,
          description: 'Payout (simulated - Stripe not configured)',
          referenceId: payout.id,
        },
      });

      res.json({
        success: true,
        data: {
          payoutId: payout.id,
          amount: availableBalance,
          status: 'completed',
          completedAt: new Date(),
        },
        message: `Payout of $${availableBalance.toFixed(2)} has been processed (simulated)`,
      });
    }
  });

/**
 * @swagger
 * /api/payouts/history:
 *   get:
 *     summary: Get payout history
 *     description: Get the authenticated user's payout history
 *     tags: [Payouts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payout history
 *       401:
 *         description: Authentication required
 */
router.get('/history', authMiddleware as any, asyncHandler(async (req: any, res: Response) => {
  const userId = req.user!.id;

  const payouts = await prisma.payouts.findMany({
    where: { userId },
    orderBy: { requestedAt: 'desc' },
  });

  res.json({
    success: true,
    data: payouts.map(p => ({
      id: p.id,
      amount: Number(p.amount),
      status: p.status,
      requestedAt: p.requestedAt,
      completedAt: p.completedAt,
      failureReason: p.failureReason,
    })),
  });
}));

export default router;
