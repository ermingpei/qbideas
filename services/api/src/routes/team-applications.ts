import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import logger from '../utils/logger';

const router = Router();

/**
 * @route   POST /api/team-applications
 * @desc    Submit an application to a team request
 * @access  Private
 */
router.post('/', authMiddleware as any, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.id;
        const { teamRequestId, message, proposedRate } = req.body;

        if (!teamRequestId) {
            res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Team request ID is required',
                },
            });
            return;
        }

        // Verify the team request exists and is open
        const teamRequest = await prisma.teamRequest.findUnique({
            where: { id: teamRequestId },
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

        if (teamRequest.status !== 'open') {
            res.status(400).json({
                error: {
                    code: 'INVALID_STATUS',
                    message: 'This team request is no longer accepting applications',
                },
            });
            return;
        }

        // Check if user already applied
        const existingApplication = await prisma.teamApplication.findFirst({
            where: {
                teamRequestId,
                applicantId: userId,
            },
        });

        if (existingApplication) {
            res.status(400).json({
                error: {
                    code: 'DUPLICATE_APPLICATION',
                    message: 'You have already applied to this team request',
                },
            });
            return;
        }

        const application = await prisma.teamApplication.create({
            data: {
                teamRequestId,
                applicantId: userId,
                message,
                proposedRate,
            },
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
                teamRequest: {
                    include: {
                        idea: {
                            select: {
                                id: true,
                                title: true,
                                slug: true,
                            },
                        },
                    },
                },
            },
        });

        logger.info(`Team application created: ${application.id} for request: ${teamRequestId}`);

        res.status(201).json({
            data: application,
        });
    } catch (error) {
        logger.error('Error creating team application:', error);
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to create team application',
            },
        });
    }
});

/**
 * @route   GET /api/team-applications
 * @desc    Get applications for the current user
 * @access  Private
 */
router.get('/', authMiddleware as any, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.id;
        const { status } = req.query;

        const where: any = {
            applicantId: userId,
        };

        if (status) {
            where.status = status;
        }

        const applications = await prisma.teamApplication.findMany({
            where,
            include: {
                teamRequest: {
                    include: {
                        idea: {
                            select: {
                                id: true,
                                title: true,
                                slug: true,
                                category: true,
                            },
                        },
                        user: {
                            select: {
                                id: true,
                                username: true,
                                profileImageUrl: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        res.json({
            data: applications,
            meta: {
                total: applications.length,
            },
        });
    } catch (error) {
        logger.error('Error fetching team applications:', error);
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to fetch team applications',
            },
        });
    }
});

/**
 * @route   GET /api/team-requests/:requestId/applications
 * @desc    Get all applications for a team request
 * @access  Private (team request owner only)
 */
router.get('/by-request/:requestId', authMiddleware as any, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.id;
        const { requestId } = req.params;

        // Verify the team request exists and user is the owner
        const teamRequest = await prisma.teamRequest.findUnique({
            where: { id: requestId },
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

        if (teamRequest.userId !== userId) {
            res.status(403).json({
                error: {
                    code: 'FORBIDDEN',
                    message: 'You can only view applications for your own team requests',
                },
            });
            return;
        }

        const applications = await prisma.teamApplication.findMany({
            where: {
                teamRequestId: requestId,
            },
            include: {
                applicant: {
                    select: {
                        id: true,
                        username: true,
                        profileImageUrl: true,
                        bio: true,
                        skills: true,
                        hourlyRate: true,
                        portfolioUrl: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        res.json({
            data: applications,
            meta: {
                total: applications.length,
            },
        });
    } catch (error) {
        logger.error('Error fetching applications for team request:', error);
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to fetch applications',
            },
        });
    }
});

/**
 * @route   PUT /api/team-applications/:id
 * @desc    Update application status (accept/decline)
 * @access  Private (team request owner only)
 */
router.put('/:id', authMiddleware as any, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.id;
        const { id } = req.params;
        const { status } = req.body;

        if (!status || !['accepted', 'declined'].includes(status)) {
            res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Valid status (accepted/declined) is required',
                },
            });
            return;
        }

        const application = await prisma.teamApplication.findUnique({
            where: { id },
            include: {
                teamRequest: true,
            },
        });

        if (!application) {
            res.status(404).json({
                error: {
                    code: 'NOT_FOUND',
                    message: 'Application not found',
                },
            });
            return;
        }

        if (application.teamRequest.userId !== userId) {
            res.status(403).json({
                error: {
                    code: 'FORBIDDEN',
                    message: 'You can only update applications for your own team requests',
                },
            });
            return;
        }

        const updatedApplication = await prisma.teamApplication.update({
            where: { id },
            data: { status },
            include: {
                applicant: {
                    select: {
                        id: true,
                        username: true,
                        profileImageUrl: true,
                        bio: true,
                        skills: true,
                    },
                },
            },
        });

        logger.info(`Team application ${id} status updated to: ${status}`);

        res.json({
            data: updatedApplication,
        });
    } catch (error) {
        logger.error('Error updating team application:', error);
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to update team application',
            },
        });
    }
});

/**
 * @route   DELETE /api/team-applications/:id
 * @desc    Withdraw an application
 * @access  Private (applicant only)
 */
router.delete('/:id', authMiddleware as any, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.id;
        const { id } = req.params;

        const application = await prisma.teamApplication.findUnique({
            where: { id },
        });

        if (!application) {
            res.status(404).json({
                error: {
                    code: 'NOT_FOUND',
                    message: 'Application not found',
                },
            });
            return;
        }

        if (application.applicantId !== userId) {
            res.status(403).json({
                error: {
                    code: 'FORBIDDEN',
                    message: 'You can only withdraw your own applications',
                },
            });
            return;
        }

        await prisma.teamApplication.delete({
            where: { id },
        });

        logger.info(`Team application deleted: ${id}`);

        res.status(204).send();
    } catch (error) {
        logger.error('Error deleting team application:', error);
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to delete team application',
            },
        });
    }
});

export default router;
