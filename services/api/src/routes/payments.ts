import { Router, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/payments/webhook:
 *   post:
 *     summary: Stripe webhook endpoint
 *     description: Handle Stripe webhook events
 *     tags: [Payments]
 *     security: []
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 */
router.post('/webhook', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // TODO: Implement Stripe webhook handling
  res.json({ received: true });
}));

export default router;