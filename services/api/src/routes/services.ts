import { Router, Response } from 'express';
import { prisma } from '../index';
import { asyncHandler } from '../middleware/errorHandler';
import { optionalAuthMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/services:
 *   get:
 *     summary: Get available premium services
 *     description: Retrieve list of available premium services
 *     tags: [Services]
 *     security: []
 *     responses:
 *       200:
 *         description: List of premium services
 */
router.get('/', optionalAuthMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const services = await prisma.premiumServices.findMany({
    where: { isActive: true },
    orderBy: { price: 'asc' },
  });

  res.json({
    success: true,
    data: services,
  });
}));

export default router;