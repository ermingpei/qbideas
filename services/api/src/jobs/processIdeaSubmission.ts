import { PrismaClient, Prisma } from '@prisma/client';
import { ideaScoringService } from '../services/scoring.service';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export async function processIdeaSubmission(ideaId: string): Promise<void> {
  try {
    logger.info(`Processing idea submission: ${ideaId}`);

    // Fetch the pending idea
    const idea = await prisma.ideas.findUnique({
      where: { id: ideaId },
      include: { contributor: true },
    });

    if (!idea) {
      logger.error(`Idea not found: ${ideaId}`);
      return;
    }

    if (idea.submissionStatus !== 'pending_review') {
      logger.warn(`Idea ${ideaId} is not pending review, skipping`);
      return;
    }

    // Prepare data for scoring
    const submissionData = {
      title: idea.title,
      teaserDescription: idea.teaserDescription,
      fullDescription: idea.fullDescription,
      problemStatement: typeof idea.problemStatement === 'string'
        ? idea.problemStatement
        : JSON.stringify(idea.problemStatement || ''),
      targetAudience: typeof idea.targetMarket === 'string'
        ? idea.targetMarket
        : JSON.stringify(idea.targetMarket || ''),
      proposedSolution: typeof idea.solutionOverview === 'string'
        ? idea.solutionOverview
        : JSON.stringify(idea.solutionOverview || ''),
      category: idea.category,
    };

    // Run scoring service
    const scoringResult = await ideaScoringService.scoreIdea(submissionData);

    if (scoringResult.approved) {
      // Idea approved - publish it
      await prisma.ideas.update({
        where: { id: ideaId },
        data: {
          submissionStatus: 'approved',
          isPublished: true,
          publishedAt: new Date(),
          tier: scoringResult.tier,
          marketPotentialScore: scoringResult.scores.marketPotential,
          technicalFeasibilityScore: scoringResult.scores.technicalFeasibility,
          innovationScore: scoringResult.scores.innovation,
          overallScore: scoringResult.overallScore,
          rejectionFeedback: Prisma.JsonNull,
        },
      });

      // Update contributor reputation
      if (idea.contributorId) {
        await prisma.user.update({
          where: { id: idea.contributorId },
          data: {
            reputationScore: { increment: 50 }, // Bonus for approved idea
          },
        });
      }

      logger.info(`Idea ${ideaId} approved and published (tier: ${scoringResult.tier}, score: ${scoringResult.overallScore})`);

      // TODO: Send notification to contributor about approval
    } else {
      // Idea rejected - store feedback
      await prisma.ideas.update({
        where: { id: ideaId },
        data: {
          submissionStatus: 'rejected',
          isPublished: false,
          marketPotentialScore: scoringResult.scores.marketPotential,
          technicalFeasibilityScore: scoringResult.scores.technicalFeasibility,
          innovationScore: scoringResult.scores.innovation,
          overallScore: scoringResult.overallScore,
          rejectionFeedback: {
            feedback: scoringResult.feedback,
            scores: scoringResult.scores as any,
            overallScore: scoringResult.overallScore,
            evaluatedAt: new Date().toISOString(),
          },
        },
      });

      logger.info(`Idea ${ideaId} rejected (score: ${scoringResult.overallScore})`);

      // TODO: Send notification to contributor with feedback
    }
  } catch (error) {
    logger.error(`Error processing idea submission ${ideaId}:`, error);

    // Mark as failed for manual review
    try {
      await prisma.ideas.update({
        where: { id: ideaId },
        data: {
          submissionStatus: 'failed',
          rejectionFeedback: {
            error: 'Automated scoring failed. Manual review required.',
            timestamp: new Date().toISOString(),
          },
        },
      });
    } catch (updateError) {
      logger.error(`Failed to update idea status after error:`, updateError);
    }

    throw error;
  }
}

// Simple queue implementation using database polling
// In production, use a proper job queue like Bull or BullMQ
export async function startSubmissionProcessor() {
  logger.info('Starting submission processor...');

  const processQueue = async () => {
    try {
      // Find pending submissions
      const pendingIdeas = await prisma.ideas.findMany({
        where: {
          submissionStatus: 'pending_review',
        },
        take: 5, // Process 5 at a time
        orderBy: {
          createdAt: 'asc',
        },
      });

      if (pendingIdeas.length > 0) {
        logger.info(`Found ${pendingIdeas.length} pending submissions to process`);

        // Process each idea
        for (const idea of pendingIdeas) {
          await processIdeaSubmission(idea.id);
        }
      }
    } catch (error) {
      logger.error('Error in submission processor:', error);
    }
  };

  // Run every 5 minutes
  setInterval(processQueue, 5 * 60 * 1000);

  // Run immediately on startup
  processQueue();
}
