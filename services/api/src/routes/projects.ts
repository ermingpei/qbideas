import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authMiddleware } from '../middleware/auth';
import logger from '../utils/logger';

const router = Router();

/**
 * @route   POST /api/projects
 * @desc    Create a new project
 * @access  Private
 */
router.post('/', authMiddleware as any, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.id;
        const { ideaId, name, description } = req.body;

        if (!ideaId || !name) {
            res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Idea ID and project name are required',
                },
            });
            return;
        }

        // Verify idea ownership or permission
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

        // Create project and add owner as admin member
        const project = await prisma.project.create({
            data: {
                ideaId,
                ownerId: userId,
                name,
                description,
                members: {
                    create: {
                        userId,
                        role: 'owner',
                    },
                },
            },
            include: {
                members: {
                    include: {
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
        });

        logger.info(`Project created: ${project.id} by user: ${userId}`);

        res.status(201).json({
            data: project,
        });
    } catch (error) {
        logger.error('Error creating project:', error);
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to create project',
            },
        });
    }
});

/**
 * @route   GET /api/projects/:id
 * @desc    Get project details
 * @access  Private (members only)
 */
router.get('/:id', authMiddleware as any, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.id;
        const { id } = req.params;

        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                profileImageUrl: true,
                                roles: true,
                                skills: true,
                                reputationScore: true,
                            },
                        },
                    },
                },
                tasks: {
                    include: {
                        assignee: {
                            select: {
                                id: true,
                                username: true,
                                profileImageUrl: true,
                                skills: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                },
                files: {
                    include: {
                        uploader: {
                            select: {
                                id: true,
                                username: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'desc',
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

        if (!project) {
            res.status(404).json({
                error: {
                    code: 'NOT_FOUND',
                    message: 'Project not found',
                },
            });
            return;
        }

        // Check membership
        const isMember = project.members.some(m => m.userId === userId);
        if (!isMember) {
            res.status(403).json({
                error: {
                    code: 'FORBIDDEN',
                    message: 'You are not a member of this project',
                },
            });
            return;
        }

        res.json({
            data: project,
        });
    } catch (error) {
        logger.error('Error fetching project:', error);
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to fetch project',
            },
        });
    }
});

/**
 * @route   POST /api/projects/:id/tasks
 * @desc    Create a task
 * @access  Private (members only)
 */
router.post('/:id/tasks', authMiddleware as any, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.id;
        const { id } = req.params;
        const { title, description, assignedTo, dueDate, status = 'todo' } = req.body;

        // Verify membership
        const membership = await prisma.projectMember.findFirst({
            where: {
                projectId: id,
                userId,
            },
        });

        if (!membership) {
            res.status(403).json({
                error: {
                    code: 'FORBIDDEN',
                    message: 'You are not a member of this project',
                },
            });
            return;
        }
        // Create task
        const task = await prisma.projectTask.create({
            data: {
                projectId: id,
                title,
                description,
                assignedTo: assignedTo || null,
                dueDate: dueDate ? new Date(dueDate) : null,
                status: status || 'todo',
            },
            include: {
                assignee: {
                    select: {
                        id: true,
                        username: true,
                        profileImageUrl: true,
                    },
                },
            },
        });

        logger.info(`Task created: ${task.id} in project: ${id}`);

        res.status(201).json({
            data: task,
        });
    } catch (error) {
        logger.error('Error creating task:', error);
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to create task',
            },
        });
    }
});

/**
 * @route   PUT /api/projects/:id/tasks/:taskId
 * @desc    Update a task
 * @access  Private (members only)
 */
router.put('/:id/tasks/:taskId', authMiddleware as any, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.id;
        const { id, taskId } = req.params;
        const { title, description, assignedTo, dueDate, status } = req.body;

        // Verify membership
        const membership = await prisma.projectMember.findFirst({
            where: {
                projectId: id,
                userId,
            },
        });

        if (!membership) {
            res.status(403).json({
                error: {
                    code: 'FORBIDDEN',
                    message: 'You are not a member of this project',
                },
            });
            return;
        }

        // Prepare update data
        const updateData: any = {
            title,
            description,
            dueDate: dueDate ? new Date(dueDate) : (dueDate === null ? null : undefined),
            status,
        };

        if (assignedTo !== undefined) {
            if (assignedTo === null) {
                updateData.assignee = { disconnect: true };
            } else {
                updateData.assignee = { connect: { id: assignedTo } };
            }
        }

        // Update task
        const task = await prisma.projectTask.update({
            where: {
                id: taskId,
                projectId: id,
            },
            data: updateData,
            include: {
                assignee: {
                    select: {
                        id: true,
                        username: true,
                        profileImageUrl: true,
                    },
                },
            },
        });

        res.json({
            data: task,
        });
    } catch (error) {
        logger.error('Error updating task:', error);
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to update task',
            },
        });
    }
});

/**
 * @route   DELETE /api/projects/:id/tasks/:taskId
 * @desc    Delete a task
 * @access  Private (members only)
 */
router.delete('/:id/tasks/:taskId', authMiddleware as any, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.id;
        const { id, taskId } = req.params;

        // Verify membership
        const membership = await prisma.projectMember.findFirst({
            where: {
                projectId: id,
                userId,
            },
        });

        if (!membership) {
            res.status(403).json({
                error: {
                    code: 'FORBIDDEN',
                    message: 'You are not a member of this project',
                },
            });
            return;
        }

        // Delete task
        await prisma.projectTask.delete({
            where: {
                id: taskId,
                projectId: id,
            },
        });

        res.json({
            success: true,
            message: 'Task deleted successfully',
        });
    } catch (error) {
        logger.error('Error deleting task:', error);
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to delete task',
            },
        });
    }
});

import multer from 'multer';
import minioClient, { BUCKET_NAME } from '../lib/storage';
import { v4 as uuidv4 } from 'uuid';

const upload = multer({ storage: multer.memoryStorage() });

/**
 * @route   POST /api/projects/:id/files
 * @desc    Upload a file to project
 * @access  Private (members only)
 */
router.post('/:id/files', authMiddleware as any, upload.single('file'), async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.id;
        const { id } = req.params;
        const file = req.file;

        if (!file) {
            res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'No file uploaded',
                },
            });
            return;
        }

        // Verify membership
        const membership = await prisma.projectMember.findFirst({
            where: {
                projectId: id,
                userId,
            },
        });

        if (!membership) {
            res.status(403).json({
                error: {
                    code: 'FORBIDDEN',
                    message: 'You are not a member of this project',
                },
            });
            return;
        }

        // Upload to MinIO
        const fileExt = file.originalname.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const objectName = `${id}/${fileName}`;

        await minioClient.putObject(BUCKET_NAME, objectName, file.buffer, file.size, {
            'Content-Type': file.mimetype,
        });

        // Generate presigned URL (valid for 7 days)
        const fileUrl = await minioClient.presignedGetObject(BUCKET_NAME, objectName, 7 * 24 * 60 * 60);

        // Create database record
        const projectFile = await prisma.projectFile.create({
            data: {
                projectId: id,
                uploadedBy: userId,
                fileName: file.originalname,
                fileUrl: fileUrl, // In a real app, you might store the object path and generate URL on read
                fileSize: file.size,
            },
            include: {
                uploader: {
                    select: {
                        id: true,
                        username: true,
                    },
                },
            },
        });

        logger.info(`File uploaded: ${projectFile.id} to project: ${id}`);

        res.status(201).json({
            data: projectFile,
        });
    } catch (error) {
        logger.error('Error uploading file:', error);
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to upload file',
            },
        });
    }
});

/**
 * @route   DELETE /api/projects/:id/files/:fileId
 * @desc    Delete a file from project
 * @access  Private (uploader or owner only)
 */
router.delete('/:id/files/:fileId', authMiddleware as any, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.id;
        const { id, fileId } = req.params;

        // Find file
        const file = await prisma.projectFile.findUnique({
            where: { id: fileId },
            include: { project: true },
        });

        if (!file) {
            res.status(404).json({
                error: {
                    code: 'NOT_FOUND',
                    message: 'File not found',
                },
            });
            return;
        }

        // Check permission (uploader or project owner)
        if (file.uploadedBy !== userId && file.project.ownerId !== userId) {
            res.status(403).json({
                error: {
                    code: 'FORBIDDEN',
                    message: 'You do not have permission to delete this file',
                },
            });
            return;
        }

        // Delete database record
        await prisma.projectFile.delete({
            where: { id: fileId },
        });

        res.json({
            success: true,
            message: 'File deleted successfully',
        });
    } catch (error) {
        logger.error('Error deleting file:', error);
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to delete file',
            },
        });
    }
});

/**
 * @route   POST /api/projects/:id/members
 * @desc    Add a member to the project
 * @access  Private (Owner only)
 */
router.post('/:id/members', authMiddleware as any, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.id;
        const { id } = req.params;
        const { username } = req.body;

        if (!username) {
            res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Username is required',
                },
            });
            return;
        }

        // Verify project ownership
        const project = await prisma.project.findUnique({
            where: { id },
        });

        if (!project) {
            res.status(404).json({
                error: {
                    code: 'NOT_FOUND',
                    message: 'Project not found',
                },
            });
            return;
        }

        if (project.ownerId !== userId) {
            res.status(403).json({
                error: {
                    code: 'FORBIDDEN',
                    message: 'Only the project owner can add members',
                },
            });
            return;
        }

        // Find user to add
        const userToAdd = await prisma.user.findUnique({
            where: { username },
        });

        if (!userToAdd) {
            res.status(404).json({
                error: {
                    code: 'NOT_FOUND',
                    message: 'User not found',
                },
            });
            return;
        }

        // Check if already a member
        const existingMember = await prisma.projectMember.findFirst({
            where: {
                projectId: id,
                userId: userToAdd.id,
            },
        });

        if (existingMember) {
            res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'User is already a member',
                },
            });
            return;
        }

        // Add member
        const member = await prisma.projectMember.create({
            data: {
                projectId: id,
                userId: userToAdd.id,
                role: 'member', // Default role
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
        });

        logger.info(`Added member ${userToAdd.username} to project ${id}`);

        res.status(201).json({
            data: member,
        });
    } catch (error) {
        logger.error('Error adding member:', error);
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to add member',
            },
        });
    }
});

/**
 * @route   DELETE /api/projects/:id/members/:memberId
 * @desc    Remove a member from the project
 * @access  Private (Owner only)
 */
router.delete('/:id/members/:memberId', authMiddleware as any, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.id;
        const { id, memberId } = req.params;

        // Verify project ownership
        const project = await prisma.project.findUnique({
            where: { id },
        });

        if (!project) {
            res.status(404).json({
                error: {
                    code: 'NOT_FOUND',
                    message: 'Project not found',
                },
            });
            return;
        }

        if (project.ownerId !== userId) {
            res.status(403).json({
                error: {
                    code: 'FORBIDDEN',
                    message: 'Only the project owner can remove members',
                },
            });
            return;
        }

        // Prevent removing self (owner)
        if (memberId === userId) {
            res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Cannot remove the project owner',
                },
            });
            return;
        }

        // Remove member
        await prisma.projectMember.deleteMany({
            where: {
                projectId: id,
                userId: memberId,
            },
        });

        logger.info(`Removed member ${memberId} from project ${id}`);

        res.status(200).json({
            success: true,
            message: 'Member removed successfully',
        });
    } catch (error) {
        logger.error('Error removing member:', error);
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to remove member',
            },
        });
    }
});

/**
 * @route   GET /api/projects/:id/comments
 * @desc    Get project comments
 * @access  Private (members only)
 */
router.get('/:id/comments', authMiddleware as any, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.id;
        const { id } = req.params;
        const { page = 1, limit = 20 } = req.query;

        // Verify membership
        const membership = await prisma.projectMember.findFirst({
            where: {
                projectId: id,
                userId,
            },
        });

        if (!membership) {
            res.status(403).json({
                error: {
                    code: 'FORBIDDEN',
                    message: 'You are not a member of this project',
                },
            });
            return;
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [comments, total] = await Promise.all([
            prisma.ideaComments.findMany({
                where: {
                    projectId: id,
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
                    projectId: id,
                    parentId: null,
                },
            }),
        ]);

        res.json({
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
    } catch (error) {
        logger.error('Error fetching project comments:', error);
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to fetch comments',
            },
        });
    }
});

/**
 * @route   POST /api/projects/:id/comments
 * @desc    Post a comment to project
 * @access  Private (members only)
 */
router.post('/:id/comments', authMiddleware as any, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.id;
        const { id } = req.params;
        const { content, parentId } = req.body;

        if (!content || content.trim().length === 0) {
            res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Comment content is required',
                },
            });
            return;
        }

        // Verify membership
        const membership = await prisma.projectMember.findFirst({
            where: {
                projectId: id,
                userId,
            },
        });

        if (!membership) {
            res.status(403).json({
                error: {
                    code: 'FORBIDDEN',
                    message: 'You are not a member of this project',
                },
            });
            return;
        }

        // If replying, verify parent comment belongs to this project
        if (parentId) {
            const parentComment = await prisma.ideaComments.findUnique({
                where: { id: parentId },
            });

            if (!parentComment || parentComment.projectId !== id) {
                res.status(400).json({
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Invalid parent comment',
                    },
                });
                return;
            }
        }

        const comment = await prisma.ideaComments.create({
            data: {
                projectId: id,
                userId,
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

        logger.info(`Comment posted to project ${id} by user ${userId}`);

        res.status(201).json({
            data: comment,
        });
    } catch (error) {
        logger.error('Error posting comment:', error);
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to post comment',
            },
        });
    }
});

export default router;
