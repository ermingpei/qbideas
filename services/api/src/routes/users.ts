import { Router, Response } from 'express';
import { prisma } from '../index';
import { asyncHandler, AppError, ErrorCodes } from '../middleware/errorHandler';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get current user profile
 *     description: Get the authenticated user's profile information
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Authentication required
 */
router.get('/profile', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      username: true,
      email: true,
      emailVerified: true,
      profileImageUrl: true,
      bio: true,
      reputationScore: true,
      totalEarnings: true,
      availableBalance: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404, ErrorCodes.AUTH_UNAUTHORIZED);
  }

  res.json({
    success: true,
    data: user,
  });
}));

/**
 * @swagger
 * /api/users/dashboard:
 *   get:
 *     summary: Get user dashboard data
 *     description: Get dashboard information including unlocked ideas, contributions, and earnings
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data
 *       401:
 *         description: Authentication required
 */
router.get('/dashboard', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  // Get user stats
  const [
    unlockedIdeasCount,
    contributedIdeasCount,
    recentTransactions,
    topContributions
  ] = await Promise.all([
    prisma.ideaUnlocks.count({ where: { userId } }),
    prisma.ideas.count({ where: { contributorId: userId } }),
    prisma.transactions.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.ideas.findMany({
      where: { contributorId: userId },
      orderBy: { overallScore: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        tier: true,
        overallScore: true,
        viewCount: true,
        likeCount: true,
        unlockCount: true,
        publishedAt: true,
      },
    }),
  ]);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      totalEarnings: true,
      availableBalance: true,
      reputationScore: true,
    },
  });

  res.json({
    success: true,
    data: {
      stats: {
        unlockedIdeas: unlockedIdeasCount,
        contributedIdeas: contributedIdeasCount,
        totalEarnings: user?.totalEarnings || 0,
        availableBalance: user?.availableBalance || 0,
        reputationScore: user?.reputationScore || 0,
      },
      recentTransactions,
      topContributions,
    },
  });
}));

export default router;