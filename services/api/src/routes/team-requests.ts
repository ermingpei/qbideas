import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import logger from '../utils/logger';

const router = Router();

/**
 * @route   POST /api/team-requests
 * @desc    Create a new team request
 * @access  Private
 */
router.post('/', authMiddleware as any, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.id;
        const { ideaId, rolesNeeded, budgetRange, timeline, description } = req.body;

        if (!ideaId || !rolesNeeded || rolesNeeded.length === 0) {
            res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Idea ID and at least one role are required',
                },
            });
            return;
        }

        // Verify the idea exists
        const idea = await prisma.ideas.findUnique({
            where: { id: ideaId },
        });

        if (!idea) {
            res.status(404).json({
                error: {
                    code: 'NOT_FOUND',
                    message: 'Idea not found',
                },
            });
            return;
        }

        const teamRequest = await prisma.teamRequest.create({
            data: {
                ideaId,
                userId,
                rolesNeeded,
                budgetRange,
                timeline,
                description,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        profileImageUrl: true,
                    },
                },
                idea: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                    },
                },
            },
        });

        logger.info(`Team request created: ${teamRequest.id} for idea: ${ideaId}`);

        res.status(201).json({
            data: teamRequest,
        });
    } catch (error) {
        logger.error('Error creating team request:', error);
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to create team request',
            },
        });
    }
});

/**
 * @route   GET /api/team-requests
 * @desc    Get all team requests with filters
 * @access  Public
 */
router.get('/', optionalAuthMiddleware as any, async (req: Request, res: Response): Promise<void> => {
    try {
        const { status, rolesNeeded, ideaId, userId } = req.query;

        const where: any = {};

        if (status) {
            where.status = status;
        }

        if (rolesNeeded) {
            where.rolesNeeded = {
                hasSome: Array.isArray(rolesNeeded) ? rolesNeeded : [rolesNeeded],
            };
        }

        if (ideaId) {
            where.ideaId = ideaId;
        }

        if (userId) {
            where.userId = userId;
        }

        const teamRequests = await prisma.teamRequest.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        profileImageUrl: true,
                    },
                },
                idea: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        category: true,
                    },
                },
                applications: {
                    select: {
                        id: true,
                        status: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        res.json({
            data: teamRequests,
            meta: {
                total: teamRequests.length,
            },
        });
    } catch (error) {
        logger.error('Error fetching team requests:', error);
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to fetch team requests',
            },
        });
    }
});

/**
 * @route   GET /api/team-requests/:id
 * @desc    Get a single team request
 * @access  Public
 */
router.get('/:id', optionalAuthMiddleware as any, async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const teamRequest = await prisma.teamRequest.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        profileImageUrl: true,
                        bio: true,
                    },
                },
                idea: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        category: true,
                        teaserDescription: true,
                    },
                },
                applications: {
                    include: {
                        applicant: {
                            select: {
                                id: true,
                                username: true,
                                profileImageUrl: true,
                                bio: true,
                                skills: true,
                                hourlyRate: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                },
            },
        });

        if (!teamRequest) {
            res.status(404).json({
                error: {
                    code: 'NOT_FOUND',
                    message: 'Team request not found',
                },
            });
            return;
        }

        res.json({
            data: teamRequest,
        });
    } catch (error) {
        logger.error('Error fetching team request:', error);
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to fetch team request',
            },
        });
    }
});

/**
 * @route   PUT /api/team-requests/:id
 * @desc    Update a team request
 * @access  Private (owner only)
 */
router.put('/:id', authMiddleware as any, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.id;
        const { id } = req.params;
        const { rolesNeeded, budgetRange, timeline, description, status } = req.body;

        const existingRequest = await prisma.teamRequest.findUnique({
            where: { id },
        });

        if (!existingRequest) {
            res.status(404).json({
                error: {
                    code: 'NOT_FOUND',
                    message: 'Team request not found',
                },
            });
            return;
        }

        if (existingRequest.userId !== userId) {
            res.status(403).json({
                error: {
                    code: 'FORBIDDEN',
                    message: 'You can only update your own team requests',
                },
            });
            return;
        }

        const updateData: any = {};
        if (rolesNeeded) updateData.rolesNeeded = rolesNeeded;
        if (budgetRange !== undefined) updateData.budgetRange = budgetRange;
        if (timeline !== undefined) updateData.timeline = timeline;
        if (description !== undefined) updateData.description = description;
        if (status) updateData.status = status;

        const teamRequest = await prisma.teamRequest.update({
            where: { id },
            data: updateData,
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        profileImageUrl: true,
                    },
                },
                idea: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                    },
                },
            },
        });

        logger.info(`Team request updated: ${id}`);

        res.json({
            data: teamRequest,
        });
    } catch (error) {
        logger.error('Error updating team request:', error);
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to update team request',
            },
        });
    }
});

/**
 * @route   DELETE /api/team-requests/:id
 * @desc    Delete a team request
 * @access  Private (owner only)
 */
router.delete('/:id', authMiddleware as any, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.id;
        const { id } = req.params;

        const existingRequest = await prisma.teamRequest.findUnique({
            where: { id },
        });

        if (!existingRequest) {
            res.status(404).json({
                error: {
                    code: 'NOT_FOUND',
                    message: 'Team request not found',
                },
            });
            return;
        }

        if (existingRequest.userId !== userId) {
            res.status(403).json({
                error: {
                    code: 'FORBIDDEN',
                    message: 'You can only delete your own team requests',
                },
            });
            return;
        }

        await prisma.teamRequest.delete({
            where: { id },
        });

        logger.info(`Team request deleted: ${id}`);

        res.status(204).send();
    } catch (error) {
        logger.error('Error deleting team request:', error);
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to delete team request',
            },
        });
    }
});

export default router;
