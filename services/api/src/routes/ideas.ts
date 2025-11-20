import { Router, Response } from 'express';
import { prisma } from '../index';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authMiddleware, optionalAuthMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { ideaValidation, calculatePagination, ErrorCodes } from '@qbideas/shared';
import { rankingService } from '../services/ranking.service';
import { revenueService } from '../services/revenue.service';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import { IdeaCategory } from '@prisma/client';

const router = Router();

/**
 * @swagger
 * /api/ideas:
 *   get:
 *     summary: Get paginated list of ideas
 *     description: Retrieve ideas with filtering, sorting, and pagination
 *     tags: [Ideas]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: tier
 *         schema:
 *           type: string
 *           enum: [regular, premium, all]
 *           default: all
 *         description: Filter by tier
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *           enum: [ai, community, all]
 *           default: all
 *         description: Filter by source
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title and description
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [newest, trending, top_rated, most_popular]
 *           default: newest
 *         description: Sort by algorithm
 *     responses:
 *       200:
 *         description: List of ideas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get('/', optionalAuthMiddleware as any, asyncHandler(async (req: any, res: Response) => {
  const {
    page = 1,
    limit = 20,
    category,
    tier = 'all',
    source = 'all',
    search,
    sortBy = 'newest',
  } = req.query;

  // Use ranking service for sorting
  const rankingOptions = {
    sortBy: sortBy as 'newest' | 'trending' | 'top_rated' | 'most_popular',
    category: category as any,
    tier: tier as 'regular' | 'premium' | 'all',
    page: parseInt(page as string),
    limit: parseInt(limit as string),
  };

  const result = await rankingService.getRankedIdeas(rankingOptions);

  // Apply search filter if provided
  let ideas: any[] = result.ideas;
  if (search) {
    const searchLower = (search as string).toLowerCase();
    ideas = ideas.filter((idea: any) =>
      idea.title.toLowerCase().includes(searchLower) ||
      idea.teaserDescription.toLowerCase().includes(searchLower)
    );
  }

  // Apply source filter if provided
  if (source !== 'all') {
    ideas = ideas.filter((idea: any) => idea.source === source);
  }

  // Check which premium ideas the user has unlocked and interaction status
  let unlockedIdeaIds: string[] = [];
  let likedIdeaIds: string[] = [];
  let bookmarkedIdeaIds: string[] = [];

  if (req.user) {
    const ideaIds = ideas.map((idea: any) => idea.id);

    const [unlocks, likes, bookmarks] = await Promise.all([
      prisma.ideaUnlocks.findMany({
        where: {
          userId: req.user.id,
          ideaId: { in: ideas.filter((idea: any) => idea.tier === 'premium').map((idea: any) => idea.id) },
        },
        select: { ideaId: true },
      }),
      prisma.ideaLikes.findMany({
        where: {
          userId: req.user.id,
          ideaId: { in: ideaIds },
        },
        select: { ideaId: true },
      }),
      prisma.ideaBookmarks.findMany({
        where: {
          userId: req.user.id,
          ideaId: { in: ideaIds },
        },
        select: { ideaId: true },
      }),
    ]);

    unlockedIdeaIds = unlocks.map(unlock => unlock.ideaId);
    likedIdeaIds = likes.map(like => like.ideaId);
    bookmarkedIdeaIds = bookmarks.map(bookmark => bookmark.ideaId);
  }

  // Add unlocked and interaction status to ideas
  const ideasWithUnlockStatus = ideas.map((idea: any) => ({
    ...idea,
    isUnlocked: idea.tier === 'regular' || unlockedIdeaIds.includes(idea.id),
    isLiked: likedIdeaIds.includes(idea.id),
    isBookmarked: bookmarkedIdeaIds.includes(idea.id),
  }));

  res.json({
    success: true,
    data: {
      items: ideasWithUnlockStatus,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    },
  });
}));

/**
 * @swagger
 * /api/ideas/{id}:
 *   get:
 *     summary: Get idea by ID
 *     description: Retrieve a specific idea by its ID
 *     tags: [Ideas]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Idea ID
 *     responses:
 *       200:
 *         description: Idea details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Idea'
 *       404:
 *         description: Idea not found
 */
router.get('/:id', optionalAuthMiddleware as any, asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;

  // Check if the parameter is a UUID or a slug
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  const idea = await prisma.ideas.findUnique({
    where: isUUID ? { id } : { slug: id },
    include: {
      contributor: {
        select: {
          id: true,
          username: true,
          profileImageUrl: true,
          reputationScore: true,
        },
      },
    },
  });

  if (!idea) {
    throw new AppError('Idea not found', 404, ErrorCodes.IDEA_NOT_FOUND);
  }

  // Check if user has unlocked this premium idea and interaction status
  let isUnlocked = idea.tier === 'regular';
  let isLiked = false;
  let isBookmarked = false;

  if (req.user) {
    const [unlock, like, bookmark] = await Promise.all([
      idea.tier === 'premium' ? prisma.ideaUnlocks.findUnique({
        where: {
          userId_ideaId: {
            userId: req.user.id,
            ideaId: idea.id,
          },
        },
      }) : Promise.resolve(null),
      prisma.ideaLikes.findUnique({
        where: {
          userId_ideaId: {
            userId: req.user.id,
            ideaId: idea.id,
          },
        },
      }),
      prisma.ideaBookmarks.findUnique({
        where: {
          userId_ideaId: {
            userId: req.user.id,
            ideaId: idea.id,
          },
        },
      }),
    ]);

    isUnlocked = idea.tier === 'regular' || !!unlock;
    isLiked = !!like;
    isBookmarked = !!bookmark;
  }

  // Increment view count (async, don't wait)
  prisma.ideas.update({
    where: { id: idea.id },
    data: { viewCount: { increment: 1 } },
  }).catch(() => { }); // Ignore errors for view count updates

  // Prepare response data
  let responseData: any = {
    ...idea,
    isUnlocked,
    isLiked,
    isBookmarked,
  };

  // If premium and not unlocked, hide sensitive data
  if (idea.tier === 'premium' && !isUnlocked) {
    responseData = {
      id: idea.id,
      title: idea.title,
      slug: idea.slug,
      teaserDescription: idea.teaserDescription,
      category: idea.category,
      tier: idea.tier,
      source: idea.source,
      overallScore: idea.overallScore,
      viewCount: idea.viewCount,
      likeCount: idea.likeCount,
      commentCount: idea.commentCount,
      unlockCount: idea.unlockCount,
      publishedAt: idea.publishedAt,
      unlockPrice: idea.unlockPrice,
      contributor: idea.contributor,
      isUnlocked: false,
    };
  }

  res.json({
    success: true,
    data: responseData,
  });
}));

/**
 * @swagger
 * /api/ideas:
 *   post:
 *     summary: Submit a community idea
 *     description: Submit a new idea from the community
 *     tags: [Ideas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - category
 *               - problemStatement
 *               - targetAudience
 *               - proposedSolution
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 200
 *               description:
 *                 type: string
 *                 minLength: 50
 *                 maxLength: 5000
 *               category:
 *                 type: string
 *                 enum: [productivity, entertainment, education, health, business, social, finance, travel, food, lifestyle, technology, other]
 *               problemStatement:
 *                 type: string
 *                 minLength: 20
 *                 maxLength: 1000
 *               targetAudience:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 500
 *               proposedSolution:
 *                 type: string
 *                 minLength: 20
 *                 maxLength: 2000
 *     responses:
 *       201:
 *         description: Idea submitted successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Authentication required
 */
router.post(
  '/',
  authMiddleware as any,
  [
    body('title').isString().notEmpty(),
    body('teaserDescription').isString().notEmpty(),
    body('category').isIn(Object.values(IdeaCategory)),
  ],
  validate,
  async (req: any, res: Response) => {
    // Manual validation since we're not using the shared package validation
    const { title, description, category, problemStatement, targetAudience, proposedSolution, tier, unlockPrice } = req.body;

    // Validate required fields
    if (!title || title.length < 10 || title.length > 200) {
      throw new AppError('Title must be between 10 and 200 characters', 400, ErrorCodes.VALIDATION_ERROR);
    }

    if (!description || description.length < 50) {
      throw new AppError('Description must be at least 50 characters', 400, ErrorCodes.VALIDATION_ERROR);
    }

    if (!category) {
      throw new AppError('Category is required', 400, ErrorCodes.VALIDATION_ERROR);
    }

    if (!problemStatement || problemStatement.length < 20) {
      throw new AppError('Problem statement must be at least 20 characters', 400, ErrorCodes.VALIDATION_ERROR);
    }

    if (!targetAudience || targetAudience.length < 10) {
      throw new AppError('Target audience must be at least 10 characters', 400, ErrorCodes.VALIDATION_ERROR);
    }

    if (!proposedSolution || proposedSolution.length < 20) {
      throw new AppError('Proposed solution must be at least 20 characters', 400, ErrorCodes.VALIDATION_ERROR);
    }

    // Validate tier and pricing
    const ideaTier = tier || 'regular';
    let finalUnlockPrice = 0;

    if (ideaTier === 'premium') {
      const price = parseFloat(unlockPrice);
      if (isNaN(price) || price < 0.99 || price > 99.99) {
        throw new AppError('Premium ideas must have a price between $0.99 and $99.99', 400, ErrorCodes.VALIDATION_ERROR);
      }
      finalUnlockPrice = price;
    }

    // Check rate limit: max 5 submissions per day
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentSubmissions = await prisma.ideas.count({
      where: {
        contributorId: req.user!.id,
        createdAt: { gte: oneDayAgo },
      },
    });

    if (recentSubmissions >= 5) {
      throw new AppError('Daily submission limit reached (5 per day)', 429, ErrorCodes.RATE_LIMIT_EXCEEDED);
    }

    // Generate slug
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 100);

    // Ensure unique slug
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.ideas.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create idea with pending status for AI evaluation
    const idea = await prisma.ideas.create({
      data: {
        title,
        slug,
        teaserDescription: description.substring(0, 300) + (description.length > 300 ? '...' : ''),
        fullDescription: description,
        category: category as any,
        tier: ideaTier as any,
        unlockPrice: finalUnlockPrice,
        source: 'community',
        contributorId: req.user!.id,
        submissionStatus: 'pending_review',
        isPublished: false,
        problemStatement: {
          problemDescription: problemStatement,
          targetAudience,
          proposedSolution,
        },
        targetMarket: { targetAudience },
        solutionOverview: { proposedSolution },
        marketPotentialScore: 0.5,
        technicalFeasibilityScore: 0.5,
        innovationScore: 0.5,
        overallScore: 0.5,
      },
      include: {
        contributor: {
          select: {
            id: true,
            username: true,
            profileImageUrl: true,
          },
        },
      },
    });

    // Background job will process this submission

    res.status(201).json({
      success: true,
      data: {
        id: idea.id,
        title: idea.title,
        status: 'pending_review',
        submittedAt: idea.createdAt,
      },
      message: 'Idea submitted successfully and is being evaluated. You will be notified once the review is complete.',
    });
  });

/**
 * @swagger
 * /api/ideas/submissions/{id}:
 *   get:
 *     summary: Get submission status
 *     description: Get the status and feedback for a submitted idea
 *     tags: [Ideas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Idea ID
 *     responses:
 *       200:
 *         description: Submission status
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Not authorized to view this submission
 *       404:
 *         description: Submission not found
 */
router.get('/submissions/:id', authMiddleware as any, asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;

  const idea = await prisma.ideas.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      submissionStatus: true,
      contributorId: true,
      rejectionFeedback: true,
      marketPotentialScore: true,
      technicalFeasibilityScore: true,
      innovationScore: true,
      overallScore: true,
      tier: true,
      createdAt: true,
      publishedAt: true,
    },
  });

  if (!idea) {
    throw new AppError('Submission not found', 404, ErrorCodes.IDEA_NOT_FOUND);
  }

  // Only the contributor can view their submission status
  if (idea.contributorId !== req.user!.id) {
    throw new AppError('Not authorized to view this submission', 403, ErrorCodes.UNAUTHORIZED);
  }

  res.json({
    success: true,
    data: {
      id: idea.id,
      title: idea.title,
      status: idea.submissionStatus,
      submittedAt: idea.createdAt,
      publishedAt: idea.publishedAt,
      tier: idea.tier,
      scores: idea.submissionStatus !== 'pending_review' ? {
        marketPotential: idea.marketPotentialScore,
        technicalFeasibility: idea.technicalFeasibilityScore,
        innovation: idea.innovationScore,
        overall: idea.overallScore,
      } : null,
      feedback: idea.rejectionFeedback,
    },
  });
}));

/**
 * @swagger
 * /api/ideas/{id}/unlock:
 *   post:
 *     summary: Unlock a premium idea
 *     description: Purchase access to a premium idea
 *     tags: [Ideas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Idea ID
 *     responses:
 *       200:
 *         description: Idea unlocked successfully
 *       400:
 *         description: Idea already unlocked or not premium
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Idea not found
 */
router.post('/:id/unlock', authMiddleware as any, asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;

  const idea = await prisma.ideas.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      tier: true,
      unlockPrice: true,
      contributorId: true,
      source: true,
    },
  });

  if (!idea) {
    throw new AppError('Idea not found', 404, ErrorCodes.IDEA_NOT_FOUND);
  }

  if (idea.tier !== 'premium') {
    throw new AppError('This idea is not premium', 400, ErrorCodes.IDEA_ALREADY_UNLOCKED);
  }

  // Check if already unlocked
  const existingUnlock = await prisma.ideaUnlocks.findUnique({
    where: {
      userId_ideaId: {
        userId: req.user!.id,
        ideaId: idea.id,
      },
    },
  });

  if (existingUnlock) {
    throw new AppError('Idea already unlocked', 400, ErrorCodes.IDEA_ALREADY_UNLOCKED);
  }

  // TODO: Process payment with Stripe
  // For now, we'll process the unlock directly
  const stripePaymentIntentId = undefined; // Will be set when Stripe is integrated

  // Use revenue service to handle unlock and revenue allocation
  const revenueResult = await revenueService.processIdeaUnlock(
    req.user!.id,
    idea.id,
    Number(idea.unlockPrice),
    stripePaymentIntentId
  );

  res.json({
    success: true,
    data: {
      ideaId: idea.id,
      title: idea.title,
      unlockedAt: new Date(),
      paymentAmount: Number(idea.unlockPrice),
      source: idea.source,
      contributorShare: revenueResult.contributorShare,
    },
    message: 'Idea unlocked successfully',
  });
}));

export default router;