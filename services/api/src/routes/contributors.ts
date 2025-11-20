import { Router, Response } from 'express';
import { prisma } from '../index';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authMiddleware, optionalAuthMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { ErrorCodes } from '@qbideas/shared';
import { revenueService } from '../services/revenue.service';

const router = Router();

/**
 * @swagger
 * /api/contributors/{userId}/earnings:
 *   get:
 *     summary: Get contributor earnings
 *     description: Get earnings summary, transaction history, and payout history for a contributor
 *     tags: [Contributors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: Earnings data
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Not authorized to view this data
 *       404:
 *         description: User not found
 */
router.get(
  '/earnings',
  authMiddleware as any,
  async (req: any, res: Response) => {
    const { userId } = req.params;

    // Only allow users to view their own earnings
    if (req.user!.id !== userId) {
      throw new AppError('Not authorized to view this earnings data', 403, ErrorCodes.UNAUTHORIZED);
    }

    const earnings = await revenueService.getContributorEarnings(userId);

    res.json({
      success: true,
      data: earnings,
    });
  });

/**
 * @swagger
 * /api/contributors/{userId}:
 *   get:
 *     summary: Get contributor profile
 *     description: Get public profile information for a contributor
 *     tags: [Contributors]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: Contributor profile
 *       404:
 *         description: User not found
 */
router.get('/:userId', optionalAuthMiddleware as any, asyncHandler(async (req: any, res: Response) => {
  const { userId } = req.params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      profileImageUrl: true,
      bio: true,
      reputationScore: true,
      totalEarnings: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404, ErrorCodes.USER_NOT_FOUND);
  }

  // Get contributor's published ideas
  const ideas = await prisma.ideas.findMany({
    where: {
      contributorId: userId,
      isPublished: true,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      teaserDescription: true,
      category: true,
      tier: true,
      overallScore: true,
      viewCount: true,
      likeCount: true,
      commentCount: true,
      unlockCount: true,
      publishedAt: true,
    },
    orderBy: { publishedAt: 'desc' },
  });

  // Calculate stats
  const stats = {
    totalIdeas: ideas.length,
    publishedIdeas: ideas.length,
    totalViews: ideas.reduce((sum, idea) => sum + idea.viewCount, 0),
    totalLikes: ideas.reduce((sum, idea) => sum + idea.likeCount, 0),
    totalUnlocks: ideas.reduce((sum, idea) => sum + idea.unlockCount, 0),
  };

  // Calculate badge based on reputation score
  const getBadge = (score: number) => {
    if (score >= 10000) return 'platinum';
    if (score >= 2000) return 'gold';
    if (score >= 500) return 'silver';
    if (score >= 100) return 'bronze';
    return 'none';
  };

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        username: user.username,
        profileImageUrl: user.profileImageUrl,
        bio: user.bio,
        reputationScore: user.reputationScore,
        totalEarnings: Number(user.totalEarnings),
        createdAt: user.createdAt,
        badge: getBadge(user.reputationScore),
      },
      stats,
      ideas: ideas.map(idea => ({
        ...idea,
        overallScore: Number(idea.overallScore),
      })),
    },
  });
}));

/**
 * @swagger
 * /api/contributors/{userId}/stats:
 *   get:
 *     summary: Get contributor statistics
 *     description: Get detailed statistics for a contributor
 *     tags: [Contributors]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: Contributor statistics
 *       404:
 *         description: User not found
 */
router.get('/:userId/stats', optionalAuthMiddleware as any, asyncHandler(async (req: any, res: Response) => {
  const { userId } = req.params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError('User not found', 404, ErrorCodes.USER_NOT_FOUND);
  }

  // Get all ideas (published and pending)
  const allIdeas = await prisma.ideas.findMany({
    where: { contributorId: userId },
    select: {
      id: true,
      submissionStatus: true,
      isPublished: true,
      viewCount: true,
      likeCount: true,
      unlockCount: true,
      tier: true,
    },
  });

  const publishedIdeas = allIdeas.filter(i => i.isPublished);
  const pendingIdeas = allIdeas.filter(i => i.submissionStatus === 'pending_review');
  const rejectedIdeas = allIdeas.filter(i => i.submissionStatus === 'rejected');

  const stats = {
    totalIdeas: allIdeas.length,
    publishedIdeas: publishedIdeas.length,
    pendingIdeas: pendingIdeas.length,
    rejectedIdeas: rejectedIdeas.length,
    premiumIdeas: publishedIdeas.filter(i => i.tier === 'premium').length,
    regularIdeas: publishedIdeas.filter(i => i.tier === 'regular').length,
    totalViews: publishedIdeas.reduce((sum, idea) => sum + idea.viewCount, 0),
    totalLikes: publishedIdeas.reduce((sum, idea) => sum + idea.likeCount, 0),
    totalUnlocks: publishedIdeas.reduce((sum, idea) => sum + idea.unlockCount, 0),
    avgViewsPerIdea: publishedIdeas.length > 0
      ? Math.round(publishedIdeas.reduce((sum, idea) => sum + idea.viewCount, 0) / publishedIdeas.length)
      : 0,
    avgLikesPerIdea: publishedIdeas.length > 0
      ? Math.round(publishedIdeas.reduce((sum, idea) => sum + idea.likeCount, 0) / publishedIdeas.length)
      : 0,
  };

  res.json({
    success: true,
    data: stats,
  });
}));

export default router;
