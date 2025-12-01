import { Router, Response } from 'express';
import { prisma } from '../index';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { ErrorCodes } from '@qbideas/shared';

const router = Router();

/**
 * Like/Unlike an idea
 */
router.post('/:ideaId/like', authMiddleware as any, asyncHandler(async (req: any, res: Response) => {
  const { ideaId } = req.params;
  const userId = req.user!.id;

  // Check if idea exists
  const idea = await prisma.ideas.findUnique({
    where: { id: ideaId },
    select: { id: true },
  });

  if (!idea) {
    throw new AppError('Idea not found', 404, ErrorCodes.IDEA_NOT_FOUND);
  }

  // Check if already liked
  const existingLike = await prisma.ideaLikes.findUnique({
    where: {
      userId_ideaId: {
        userId,
        ideaId,
      },
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

    return res.json({
      success: true,
      data: { liked: false },
      message: 'Idea unliked',
    });
  } else {
    // Like
    await prisma.$transaction([
      prisma.ideaLikes.create({
        data: {
          userId,
          ideaId,
        },
      }),
      prisma.ideas.update({
        where: { id: ideaId },
        data: { likeCount: { increment: 1 } },
      }),
    ]);

    return res.json({
      success: true,
      data: { liked: true },
      message: 'Idea liked',
    });
  }
}));

/**
 * Bookmark/Unbookmark an idea
 */
router.post('/:ideaId/bookmark', authMiddleware as any, asyncHandler(async (req: any, res: Response) => {
  const { ideaId } = req.params;
  const userId = req.user!.id;

  // Check if idea exists
  const idea = await prisma.ideas.findUnique({
    where: { id: ideaId },
    select: { id: true },
  });

  if (!idea) {
    throw new AppError('Idea not found', 404, ErrorCodes.IDEA_NOT_FOUND);
  }

  // Check if already bookmarked
  const existingBookmark = await prisma.ideaBookmarks.findUnique({
    where: {
      userId_ideaId: {
        userId,
        ideaId,
      },
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

    return res.json({
      success: true,
      data: { bookmarked: false },
      message: 'Bookmark removed',
    });
  } else {
    // Add bookmark
    await prisma.$transaction([
      prisma.ideaBookmarks.create({
        data: {
          userId,
          ideaId,
        },
      }),
      prisma.ideas.update({
        where: { id: ideaId },
        data: { bookmarkCount: { increment: 1 } },
      }),
    ]);

    return res.json({
      success: true,
      data: { bookmarked: true },
      message: 'Idea bookmarked',
    });
  }
}));

/**
 * Get comments for an idea
 */
router.get('/:ideaId/comments', asyncHandler(async (req: any, res: Response) => {
  const { ideaId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const skip = (Number(page) - 1) * Number(limit);

  const [comments, total] = await Promise.all([
    prisma.ideaComments.findMany({
      where: {
        ideaId,
        parentId: null, // Only top-level comments
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profileImageUrl: true,
            reputationScore: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                profileImageUrl: true,
                reputationScore: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit),
    }),
    prisma.ideaComments.count({
      where: {
        ideaId,
        parentId: null,
      },
    }),
  ]);

  res.json({
    success: true,
    data: {
      items: comments,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    },
  });
}));

/**
 * Post a comment on an idea
 */
router.post('/:ideaId/comments', authMiddleware as any, asyncHandler(async (req: any, res: Response) => {
  const { ideaId } = req.params;
  const { content, parentId } = req.body;
  const userId = req.user!.id;

  if (!content || content.trim().length === 0) {
    throw new AppError('Comment content is required', 400, ErrorCodes.VALIDATION_ERROR);
  }

  if (content.length > 2000) {
    throw new AppError('Comment is too long (max 2000 characters)', 400, ErrorCodes.VALIDATION_ERROR);
  }

  // Check if idea exists
  const idea = await prisma.ideas.findUnique({
    where: { id: ideaId },
    select: { id: true },
  });

  if (!idea) {
    throw new AppError('Idea not found', 404, ErrorCodes.IDEA_NOT_FOUND);
  }

  // If replying to a comment, check if parent exists
  if (parentId) {
    const parentComment = await prisma.ideaComments.findUnique({
      where: { id: parentId },
      select: { id: true, ideaId: true },
    });

    if (!parentComment || parentComment.ideaId !== ideaId) {
      throw new AppError('Parent comment not found', 404, ErrorCodes.VALIDATION_ERROR);
    }
  }

  // Create comment and increment count
  const comment = await prisma.ideaComments.create({
    data: {
      userId,
      ideaId,
      content: content.trim(),
      parentId: parentId || null,
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          profileImageUrl: true,
          reputationScore: true,
        },
      },
    },
  });

  // Only increment count for top-level comments
  if (!parentId) {
    await prisma.ideas.update({
      where: { id: ideaId },
      data: { commentCount: { increment: 1 } },
    });
  }

  res.status(201).json({
    success: true,
    data: comment,
    message: 'Comment posted successfully',
  });
}));

/**
 * Update a comment
 */
router.put('/comments/:commentId', authMiddleware as any, asyncHandler(async (req: any, res: Response) => {
  const { commentId } = req.params;
  const { content } = req.body;
  const userId = req.user!.id;

  if (!content || content.trim().length === 0) {
    throw new AppError('Comment content is required', 400, ErrorCodes.VALIDATION_ERROR);
  }

  if (content.length > 2000) {
    throw new AppError('Comment is too long (max 2000 characters)', 400, ErrorCodes.VALIDATION_ERROR);
  }

  // Check if comment exists and user owns it
  const comment = await prisma.ideaComments.findUnique({
    where: { id: commentId },
    select: { userId: true },
  });

  if (!comment) {
    throw new AppError('Comment not found', 404, ErrorCodes.VALIDATION_ERROR);
  }

  if (comment.userId !== userId) {
    throw new AppError('Not authorized to edit this comment', 403, ErrorCodes.UNAUTHORIZED);
  }

  const updatedComment = await prisma.ideaComments.update({
    where: { id: commentId },
    data: {
      content: content.trim(),
      isEdited: true,
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          profileImageUrl: true,
          reputationScore: true,
        },
      },
    },
  });

  res.json({
    success: true,
    data: updatedComment,
    message: 'Comment updated successfully',
  });
}));

/**
 * Delete a comment
 */
router.delete('/comments/:commentId', authMiddleware as any, asyncHandler(async (req: any, res: Response) => {
  const { commentId } = req.params;
  const userId = req.user!.id;

  // Check if comment exists and user owns it
  const comment = await prisma.ideaComments.findUnique({
    where: { id: commentId },
    select: { userId: true, parentId: true, ideaId: true },
  });

  if (!comment) {
    throw new AppError('Comment not found', 404, ErrorCodes.VALIDATION_ERROR);
  }

  if (comment.userId !== userId) {
    throw new AppError('Not authorized to delete this comment', 403, ErrorCodes.UNAUTHORIZED);
  }

  // Delete comment
  await prisma.ideaComments.delete({
    where: { id: commentId },
  });

  // Decrement count if top-level and linked to an idea
  if (!comment.parentId && comment.ideaId) {
    await prisma.ideas.update({
      where: { id: comment.ideaId },
      data: { commentCount: { decrement: 1 } },
    });
  }

  res.json({
    success: true,
    message: 'Comment deleted successfully',
  });
}));

/**
 * Get user's interaction status with an idea
 */
router.get(
  '/user',
  authMiddleware as any,
  async (req: any, res: Response) => {
    const { ideaId } = req.params;
    const userId = req.user!.id;

    const [liked, bookmarked] = await Promise.all([
      prisma.ideaLikes.findUnique({
        where: {
          userId_ideaId: {
            userId,
            ideaId,
          },
        },
      }),
      prisma.ideaBookmarks.findUnique({
        where: {
          userId_ideaId: {
            userId,
            ideaId,
          },
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        liked: !!liked,
        bookmarked: !!bookmarked,
      },
    });
  });

export default router;
