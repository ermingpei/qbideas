import { Router, Response } from 'express';
import { body, param, query } from 'express-validator';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { prisma } from '../index';
import logger from '../utils/logger';

const router = Router();

/**
 * @route   GET /api/marketplace/ideas
 * @desc    Browse ideas with filtering and sorting
 * @access  Public
 */
router.get(
  '/ideas',
  optionalAuthMiddleware as any,
  [
    query('category').optional({ values: 'falsy' }).isString(),
    query('difficulty').optional({ values: 'falsy' }).isIn(['beginner', 'intermediate', 'advanced']),
    query('sort').optional({ values: 'falsy' }).isIn(['trending', 'newest', 'popular', 'top_rated']),
    query('search').optional({ values: 'falsy' }).isString(),
    query('page').optional({ values: 'falsy' }).isInt({ min: 1 }),
    query('limit').optional({ values: 'falsy' }).isInt({ min: 1, max: 50 }),
  ],
  validate,
  async (req: any, res: Response) => {
    try {
      const {
        category,
        difficulty,
        sort = 'newest',
        search,
        page = 1,
        limit = 20,
      } = req.query;

      const where: any = { isPublished: true };

      if (category) {
        where.category = category;
      }

      if (difficulty) {
        where.difficultyLevel = difficulty;
      }

      if (search) {
        where.OR = [
          { title: { contains: search as string, mode: 'insensitive' } },
          { teaserDescription: { contains: search as string, mode: 'insensitive' } },
          { tags: { has: search as string } },
        ];
      }

      // Determine sort order
      let orderBy: any = { publishedAt: 'desc' };
      if (sort === 'popular') {
        orderBy = { likeCount: 'desc' };
      } else if (sort === 'top_rated') {
        orderBy = { overallScore: 'desc' };
      } else if (sort === 'trending') {
        orderBy = [{ buildCount: 'desc' }, { likeCount: 'desc' }];
      }

      const [ideas, total] = await Promise.all([
        prisma.ideas.findMany({
          where,
          select: {
            id: true,
            title: true,
            slug: true,
            teaserDescription: true,
            category: true,
            tags: true,
            tier: true,
            isFeatured: true,
            marketPotentialScore: true,
            technicalFeasibilityScore: true,
            innovationScore: true,
            overallScore: true,
            difficultyLevel: true,
            viewCount: true,
            likeCount: true,
            commentCount: true,
            bookmarkCount: true,
            buildCount: true,
            estimatedLaunchTime: true,
            estimatedCost: true,
            unlockPrice: true,
            publishedAt: true,
            contributor: {
              select: {
                id: true,
                username: true,
                profileImageUrl: true,
              },
            },
          },
          orderBy,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
        }),
        prisma.ideas.count({ where }),
      ]);

      // If user is authenticated, include their interactions
      let userInteractions: any = {};
      if (req.user) {
        const ideaIds = ideas.map((i) => i.id);
        const [likes, bookmarks, unlocks] = await Promise.all([
          prisma.ideaLikes.findMany({
            where: { userId: req.user.id, ideaId: { in: ideaIds } },
            select: { ideaId: true },
          }),
          prisma.ideaBookmarks.findMany({
            where: { userId: req.user.id, ideaId: { in: ideaIds } },
            select: { ideaId: true },
          }),
          prisma.ideaUnlocks.findMany({
            where: { userId: req.user.id, ideaId: { in: ideaIds } },
            select: { ideaId: true },
          }),
        ]);

        userInteractions = {
          liked: new Set(likes.map((l) => l.ideaId)),
          bookmarked: new Set(bookmarks.map((b) => b.ideaId)),
          unlocked: new Set(unlocks.map((u) => u.ideaId)),
        };
      }

      const ideasWithInteractions = ideas.map((idea) => ({
        ...idea,
        isLiked: userInteractions.liked?.has(idea.id) || false,
        isBookmarked: userInteractions.bookmarked?.has(idea.id) || false,
        isUnlocked: userInteractions.unlocked?.has(idea.id) || false,
      }));

      res.json({
        success: true,
        data: {
          ideas: ideasWithInteractions,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      logger.error('Error fetching ideas:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'MKT_001',
          message: 'Failed to fetch ideas',
        },
      });
    }
  }
);

/**
 * @route   GET /api/marketplace/ideas/featured
 * @desc    Get featured ideas
 * @access  Public
 */
router.get('/ideas/featured', async (req, res) => {
  try {
    const featuredIdeas = await prisma.ideas.findMany({
      where: {
        isPublished: true,
        isFeatured: true,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        teaserDescription: true,
        category: true,
        tags: true,
        overallScore: true,
        difficultyLevel: true,
        likeCount: true,
        buildCount: true,
        estimatedCost: true,
        estimatedLaunchTime: true,
      },
      orderBy: { featuredAt: 'desc' },
      take: 6,
    });

    res.json({
      success: true,
      data: featuredIdeas,
    });
  } catch (error) {
    logger.error('Error fetching featured ideas:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'MKT_002',
        message: 'Failed to fetch featured ideas',
      },
    });
  }
});

/**
 * @route   GET /api/marketplace/ideas/:slug
 * @desc    Get idea details by slug
 * @access  Public (teaser) / Private (full details if unlocked)
 */
router.get(
  '/ideas/:slug',
  optionalAuthMiddleware as any,
  [param('slug').isString().notEmpty()],
  validate,
  async (req: any, res: Response) => {
    try {
      const { slug } = req.params;

      const idea = await prisma.ideas.findUnique({
        where: { slug },
        include: {
          contributor: {
            select: {
              id: true,
              username: true,
              profileImageUrl: true,
              bio: true,
            },
          },
        },
      });

      if (!idea || !idea.isPublished) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'MKT_003',
            message: 'Idea not found',
          },
        });
      }

      // Increment view count
      await prisma.ideas.update({
        where: { id: idea.id },
        data: { viewCount: { increment: 1 } },
      });

      // Check if user has unlocked this idea
      let isUnlocked = false;
      let hasProSubscription = false;

      if (req.user) {
        const [unlock, user] = await Promise.all([
          prisma.ideaUnlocks.findUnique({
            where: {
              userId_ideaId: {
                userId: req.user.id,
                ideaId: idea.id,
              },
            },
          }),
          prisma.user.findUnique({
            where: { id: req.user.id },
            select: { subscriptionTier: true, subscriptionStatus: true },
          }),
        ]);

        isUnlocked = !!unlock;
        hasProSubscription = user?.subscriptionTier === 'pro' && user?.subscriptionStatus === 'active';
      }

      // Return full details if unlocked, pro subscriber, or free tier
      const canViewFullDetails = isUnlocked || hasProSubscription || idea.tier === 'regular';

      const response: any = {
        id: idea.id,
        title: idea.title,
        slug: idea.slug,
        teaserDescription: idea.teaserDescription,
        category: idea.category,
        tags: idea.tags,
        tier: idea.tier,
        source: idea.source,
        isFeatured: idea.isFeatured,
        marketPotentialScore: idea.marketPotentialScore,
        technicalFeasibilityScore: idea.technicalFeasibilityScore,
        innovationScore: idea.innovationScore,
        overallScore: idea.overallScore,
        difficultyLevel: idea.difficultyLevel,
        viewCount: idea.viewCount,
        likeCount: idea.likeCount,
        commentCount: idea.commentCount,
        bookmarkCount: idea.bookmarkCount,
        buildCount: idea.buildCount,
        estimatedLaunchTime: idea.estimatedLaunchTime,
        estimatedCost: idea.estimatedCost,
        unlockPrice: idea.unlockPrice,
        publishedAt: idea.publishedAt,
        contributor: idea.contributor,
        isUnlocked: canViewFullDetails,
      };

      if (canViewFullDetails) {
        response.fullDescription = idea.fullDescription;
        response.executiveSummary = idea.executiveSummary;
        response.problemStatement = idea.problemStatement;
        response.solutionOverview = idea.solutionOverview;
        response.targetMarket = idea.targetMarket;
        response.competitiveAnalysis = idea.competitiveAnalysis;
        response.technicalArchitecture = idea.technicalArchitecture;
        response.goToMarketStrategy = idea.goToMarketStrategy;
        response.financialProjections = idea.financialProjections;
        response.riskAssessment = idea.riskAssessment;
        response.executionPlaybook = idea.executionPlaybook;
        response.recommendedServices = idea.recommendedServices;
      }

      return res.json({
        success: true,
        data: response,
      });
    } catch (error) {
      logger.error('Error fetching idea details:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'MKT_004',
          message: 'Failed to fetch idea details',
        },
      });
    }
  }
);

/**
 * @route   POST /api/marketplace/ideas/:ideaId/like
 * @desc    Like/unlike an idea
 * @access  Private
 */
router.post(
  '/ideas/:ideaId/like',
  authMiddleware as any,
  [param('ideaId').isUUID()],
  validate,
  async (req: any, res: Response) => {
    try {
      const { ideaId } = req.params;
      const userId = req.user.id;

      const existingLike = await prisma.ideaLikes.findUnique({
        where: {
          userId_ideaId: { userId, ideaId },
        },
      });

      if (existingLike) {
        // Unlike
        await prisma.$transaction([
          prisma.ideaLikes.delete({
            where: { id: existingLike.id },
          }),
          prisma.ideas.update({
            where: { id: ideaId },
            data: { likeCount: { decrement: 1 } },
          }),
        ]);

        res.json({
          success: true,
          data: { liked: false },
        });
      } else {
        // Like
        await prisma.$transaction([
          prisma.ideaLikes.create({
            data: { userId, ideaId },
          }),
          prisma.ideas.update({
            where: { id: ideaId },
            data: { likeCount: { increment: 1 } },
          }),
        ]);

        res.json({
          success: true,
          data: { liked: true },
        });
      }
    } catch (error) {
      logger.error('Error toggling like:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'MKT_005',
          message: 'Failed to toggle like',
        },
      });
    }
  }
);

/**
 * @route   POST /api/marketplace/ideas/:ideaId/bookmark
 * @desc    Bookmark/unbookmark an idea
 * @access  Private
 */
router.post(
  '/ideas/:ideaId/bookmark',
  authMiddleware as any,
  [param('ideaId').isUUID()],
  validate,
  async (req: any, res: Response) => {
    try {
      const { ideaId } = req.params;
      const userId = req.user.id;

      const existingBookmark = await prisma.ideaBookmarks.findUnique({
        where: {
          userId_ideaId: { userId, ideaId },
        },
      });

      if (existingBookmark) {
        // Remove bookmark
        await prisma.$transaction([
          prisma.ideaBookmarks.delete({
            where: { id: existingBookmark.id },
          }),
          prisma.ideas.update({
            where: { id: ideaId },
            data: { bookmarkCount: { decrement: 1 } },
          }),
        ]);

        res.json({
          success: true,
          data: { bookmarked: false },
        });
      } else {
        // Add bookmark
        await prisma.$transaction([
          prisma.ideaBookmarks.create({
            data: { userId, ideaId },
          }),
          prisma.ideas.update({
            where: { id: ideaId },
            data: { bookmarkCount: { increment: 1 } },
          }),
        ]);

        res.json({
          success: true,
          data: { bookmarked: true },
        });
      }
    } catch (error) {
      logger.error('Error toggling bookmark:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'MKT_006',
          message: 'Failed to toggle bookmark',
        },
      });
    }
  }
);

/**
 * @route   POST /api/marketplace/ideas/:ideaId/build
 * @desc    Mark that user is building this idea
 * @access  Private
 */
router.post(
  '/ideas/:ideaId/build',
  authMiddleware as any,
  [
    param('ideaId').isUUID(),
    body('title').optional().isString(),
    body('description').optional().isString(),
  ],
  validate,
  async (req: any, res: Response) => {
    try {
      const { ideaId } = req.params;
      const userId = req.user!.id;
      const { title, description } = req.body;

      // Check if already building
      const existingBuild = await prisma.ideaBuilds.findFirst({
        where: { userId, ideaId },
      });

      if (existingBuild) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MKT_007',
            message: 'You are already building this idea',
          },
        });
      }

      const build = await prisma.$transaction(async (tx) => {
        const newBuild = await tx.ideaBuilds.create({
          data: {
            userId,
            ideaId,
            title,
            description,
            status: 'planning',
          },
        });

        await tx.ideas.update({
          where: { id: ideaId },
          data: { buildCount: { increment: 1 } },
        });

        return newBuild;
      });

      return res.status(201).json({
        success: true,
        data: build,
      });
    } catch (error) {
      logger.error('Error creating build:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'MKT_008',
          message: 'Failed to create build',
        },
      });
    }
  }
);

/**
 * @route   GET /api/marketplace/ideas/:ideaId/builds
 * @desc    Get public builds for an idea
 * @access  Public
 */
router.get(
  '/ideas/:ideaId/builds',
  [param('ideaId').isUUID()],
  validate,
  async (req: any, res: Response) => {
    try {
      const { ideaId } = req.params;

      const builds = await prisma.ideaBuilds.findMany({
        where: {
          ideaId,
          isPublic: true,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              profileImageUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        success: true,
        data: builds,
      });
    } catch (error) {
      logger.error('Error fetching builds:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'MKT_009',
          message: 'Failed to fetch builds',
        },
      });
    }
  }
);

export default router;
