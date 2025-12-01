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
router.get('/me', authMiddleware as any, async (req: any, res: Response) => {
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
});

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
router.get('/dashboard', authMiddleware as any, asyncHandler(async (req: any, res: Response) => {
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

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authMiddleware as any, asyncHandler(async (req: any, res: Response) => {
  const userId = req.user!.id;
  const {
    bio,
    roles,
    skills,
    portfolioUrl,
    hourlyRate,
    availabilityStatus,
    lookingFor,
    technicalSkillLevel,
    interests,
  } = req.body;

  const updateData: any = {};
  if (bio !== undefined) updateData.bio = bio;
  if (roles !== undefined) updateData.roles = roles;
  if (skills !== undefined) updateData.skills = skills;
  if (portfolioUrl !== undefined) updateData.portfolioUrl = portfolioUrl;
  if (hourlyRate !== undefined) updateData.hourlyRate = hourlyRate;
  if (availabilityStatus !== undefined) updateData.availabilityStatus = availabilityStatus;
  if (lookingFor !== undefined) updateData.lookingFor = lookingFor;
  if (technicalSkillLevel !== undefined) updateData.technicalSkillLevel = technicalSkillLevel;
  if (interests !== undefined) updateData.interests = interests;

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      username: true,
      email: true,
      profileImageUrl: true,
      bio: true,
      roles: true,
      skills: true,
      portfolioUrl: true,
      hourlyRate: true,
      availabilityStatus: true,
      lookingFor: true,
      technicalSkillLevel: true,
      interests: true,
      reputationScore: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  res.json({
    success: true,
    data: user,
  });
}));

/**
 * @route   GET /api/users/implementors
 * @desc    Get list of users with implementor roles
 * @access  Public
 */
router.get('/implementors', asyncHandler(async (req: any, res: Response) => {
  const { role, skills, minRate, maxRate, availability, search, sort = 'newest' } = req.query;

  const where: any = {
    roles: {
      hasSome: ['developer', 'designer', 'marketer'],
    },
  };

  if (role) {
    where.roles = {
      has: role,
    };
  }

  if (skills) {
    const skillsArray = Array.isArray(skills) ? skills : [skills];
    where.skills = {
      hasSome: skillsArray,
    };
  }

  if (minRate || maxRate) {
    where.hourlyRate = {};
    if (minRate) where.hourlyRate.gte = parseFloat(minRate as string);
    if (maxRate) where.hourlyRate.lte = parseFloat(maxRate as string);
  }

  if (availability) {
    where.availabilityStatus = availability;
  }

  if (search) {
    where.OR = [
      { username: { contains: search as string, mode: 'insensitive' } },
      { bio: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  let orderBy: any = { createdAt: 'desc' };
  if (sort === 'rate_low') orderBy = { hourlyRate: 'asc' };
  if (sort === 'rate_high') orderBy = { hourlyRate: 'desc' };
  if (sort === 'reputation') orderBy = { reputationScore: 'desc' };

  const implementors = await prisma.user.findMany({
    where,
    select: {
      id: true,
      username: true,
      profileImageUrl: true,
      bio: true,
      roles: true,
      skills: true,
      portfolioUrl: true,
      hourlyRate: true,
      availabilityStatus: true,
      reputationScore: true,
      createdAt: true,
    },
    orderBy,
    take: 50,
  });

  res.json({
    success: true,
    data: implementors,
    meta: {
      total: implementors.length,
    },
  });
}));

export default router;