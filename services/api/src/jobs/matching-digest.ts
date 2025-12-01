import cron from 'node-cron';
import { prisma } from '../index';
import logger from '../utils/logger';

/**
 * Matching Digest Job
 * Runs daily at 8:00 AM
 */
export const startMatchingDigestJob = () => {
    logger.info('Initializing matching digest job...');

    // Schedule task to run at 8:00 AM every day
    cron.schedule('0 8 * * *', async () => {
        logger.info('Running matching digest job...');

        try {
            // 1. Find all users who have "lookingFor" set
            const users = await prisma.user.findMany({
                where: {
                    lookingFor: {
                        isEmpty: false,
                    },
                    notificationPreferences: {
                        path: ['email'],
                        equals: true,
                    },
                },
                select: {
                    id: true,
                    email: true,
                    username: true,
                    lookingFor: true,
                    skills: true,
                },
            });

            logger.info(`Found ${users.length} users for matching digest`);

            for (const user of users) {
                // 2. Find matching team requests
                // Logic: Request needs roles that user is looking for OR user has skills for
                const matches = await prisma.teamRequest.findMany({
                    where: {
                        status: 'open',
                        rolesNeeded: {
                            hasSome: user.lookingFor,
                        },
                        createdAt: {
                            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Created in last 24 hours
                        },
                    },
                    include: {
                        idea: {
                            select: {
                                title: true,
                                slug: true,
                            },
                        },
                    },
                    take: 5,
                });

                if (matches.length > 0) {
                    // 3. Send email (Mock)
                    logger.info(`[MOCK EMAIL] To: ${user.email}`);
                    logger.info(`Subject: ${matches.length} new opportunities match your profile!`);
                    logger.info(`Body: Hi ${user.username}, check out these new projects:`);
                    matches.forEach(match => {
                        logger.info(`- ${match.idea.title}: Needs ${match.rolesNeeded.join(', ')}`);
                    });
                    logger.info('-----------------------------------');
                }
            }

            logger.info('Matching digest job completed.');
        } catch (error) {
            logger.error('Error running matching digest job:', error);
        }
    });
};
