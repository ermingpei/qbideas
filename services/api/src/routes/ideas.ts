import { Router, Response } from 'express';
import { prisma } from '../index';
import { asyncHandler, AppError, ErrorCodes } from '../middleware/errorHandler';
import { authMiddleware, optionalAuthMiddleware, AuthenticatedRequest } from '../middleware/auth';

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
 *           enum: [publishedAt, overallScore, likeCount, viewCount]
 *           default: publishedAt
 *         description: Sort by field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of ideas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get('/', optionalAuthMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const validation = ideaValidation.filters.safeParse(req.query);
  
  if (!validation.success) {
    throw new AppError('Invalid query parameters', 400, ErrorCodes.VALIDATION_ERROR);
  }
  
  const {
    page = 1,
    limit = 20,
    category,
    tier = 'all',
    source = 'all',
    search,
    sortBy = 'publishedAt',
    sortOrder = 'desc'
  } = validation.data;
  
  const skip = (page - 1) * limit;
  
  // Build where clause
  const where: any = {};
  
  if (category) {
    where.category = category;
  }
  
  if (tier !== 'all') {
    where.tier = tier;
  }
  
  if (source !== 'all') {
    where.source = source;
  }
  
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { teaserDescription: { contains: search, mode: 'insensitive' } },
    ];
  }
  
  // Build order by clause
  const orderBy: any = {};
  orderBy[sortBy] = sortOrder;
  
  // Get total count
  const total = await prisma.ideas.count({ where });
  
  // Get ideas
  const ideas = await prisma.ideas.findMany({
    where,
    orderBy,
    skip,
    take: limit,
    select: {
      id: true,
      title: true,
      slug: true,
      teaserDescription: true,
      category: true,
      tier: true,
      source: true,
      overallScore: true,
      viewCount: true,
      likeCount: true,
      commentCount: true,
      unlockCount: true,
      publishedAt: true,
      unlockPrice: true,
      contributor: {
        select: {
          id: true,
          username: true,
          profileImageUrl: true,
        },
      },
    },
  });
  
  // Check which premium ideas the user has unlocked
  let unlockedIdeaIds: string[] = [];
  if (req.user) {
    const unlocks = await prisma.ideaUnlocks.findMany({
      where: {
        userId: req.user.id,
        ideaId: { in: ideas.filter(idea => idea.tier === 'premium').map(idea => idea.id) },
      },
      select: { ideaId: true },
    });
    unlockedIdeaIds = unlocks.map(unlock => unlock.ideaId);
  }
  
  // Add unlocked status to ideas
  const ideasWithUnlockStatus = ideas.map(idea => ({
    ...idea,
    isUnlocked: idea.tier === 'regular' || unlockedIdeaIds.includes(idea.id),
  }));
  
  const pagination = calculatePagination(page, limit, total);
  
  res.json({
    success: true,
    data: {
      items: ideasWithUnlockStatus,
      meta: pagination,
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
router.get('/:id', optionalAuthMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  
  const idea = await prisma.ideas.findUnique({
    where: { id },
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
  
  // Check if user has unlocked this premium idea
  let isUnlocked = idea.tier === 'regular';
  if (req.user && idea.tier === 'premium') {
    const unlock = await prisma.ideaUnlocks.findUnique({
      where: {
        userId_ideaId: {
          userId: req.user.id,
          ideaId: idea.id,
        },
      },
    });
    isUnlocked = !!unlock;
  }
  
  // Increment view count (async, don't wait)
  prisma.ideas.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  }).catch(() => {}); // Ignore errors for view count updates
  
  // Prepare response data
  let responseData: any = {
    ...idea,
    isUnlocked,
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
router.post('/', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const validation = ideaValidation.create.safeParse(req.body);
  
  if (!validation.success) {
    throw new AppError('Invalid idea data', 400, ErrorCodes.VALIDATION_ERROR);
  }
  
  const { title, description, category, problemStatement, targetAudience, proposedSolution } = validation.data;
  
  // Generate slug
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
  
  // Ensure unique slug
  let slug = baseSlug;
  let counter = 1;
  while (await prisma.ideas.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  // Create idea with basic scoring (will be enhanced by AI pipeline later)
  const idea = await prisma.ideas.create({
    data: {
      title,
      slug,
      teaserDescription: description.substring(0, 300) + (description.length > 300 ? '...' : ''),
      fullDescription: description,
      category,
      tier: 'regular', // Community ideas start as regular, can be upgraded by AI evaluation
      source: 'community',
      contributorId: req.user!.id,
      problemStatement: {
        problemDescription: problemStatement,
        targetAudience,
        proposedSolution,
      },
      marketPotentialScore: 5.0, // Default scores, will be updated by AI
      technicalFeasibilityScore: 5.0,
      innovationScore: 5.0,
      overallScore: 5.0,
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
  
  // TODO: Queue for AI evaluation
  
  res.status(201).json({
    success: true,
    data: idea,
    message: 'Idea submitted successfully and is being evaluated',
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
router.post('/:id/unlock', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  
  const idea = await prisma.ideas.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      tier: true,
      unlockPrice: true,
      contributorId: true,
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
  // For now, we'll create the unlock record directly
  
  const unlock = await prisma.ideaUnlocks.create({
    data: {
      userId: req.user!.id,
      ideaId: idea.id,
      paymentAmount: idea.unlockPrice,
    },
  });
  
  // Update idea unlock count
  await prisma.ideas.update({
    where: { id },
    data: { unlockCount: { increment: 1 } },
  });
  
  // Create transaction record
  await prisma.transactions.create({
    data: {
      userId: req.user!.id,
      type: 'idea_unlock',
      amount: idea.unlockPrice,
      description: `Unlocked idea: ${idea.title}`,
      referenceId: idea.id,
    },
  });
  
  // If idea has contributor, create earning record
  if (idea.contributorId) {
    const contributorShare = idea.unlockPrice * 0.6; // 60% to contributor
    
    await prisma.user.update({
      where: { id: idea.contributorId },
      data: {
        totalEarnings: { increment: contributorShare },
        availableBalance: { increment: contributorShare },
      },
    });
    
    await prisma.transactions.create({
      data: {
        userId: idea.contributorId,
        type: 'contributor_earning',
        amount: contributorShare,
        description: `Earning from idea unlock: ${idea.title}`,
        referenceId: idea.id,
      },
    });
  }
  
  res.json({
    success: true,
    data: unlock,
    message: 'Idea unlocked successfully',
  });
}));

export default router;