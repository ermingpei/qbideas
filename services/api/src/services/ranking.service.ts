import { PrismaClient, IdeaCategory, IdeaTier } from '@prisma/client';
import { redis } from '../index';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export interface RankingOptions {
  sortBy: 'newest' | 'trending' | 'top_rated' | 'most_popular';
  category?: IdeaCategory;
  tier?: 'regular' | 'premium' | 'all';
  page: number;
  limit: number;
}

interface DailyEngagement {
  views: number;
  likes: number;
  comments: number;
  unlocks: number;
}

class RankingService {
  async getRankedIdeas(options: RankingOptions) {
    switch (options.sortBy) {
      case 'newest':
        return this.getNewest(options);
      case 'trending':
        return this.getTrending(options);
      case 'top_rated':
        return this.getTopRated(options);
      case 'most_popular':
        return this.getMostPopular(options);
      default:
        return this.getNewest(options);
    }
  }

  private async getNewest(options: RankingOptions) {
    const where = this.buildWhereClause(options);
    
    const [ideas, total] = await Promise.all([
      prisma.ideas.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip: (options.page - 1) * options.limit,
        take: options.limit,
        include: this.getIncludeClause(),
      }),
      prisma.ideas.count({ where }),
    ]);

    return {
      ideas,
      total,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(total / options.limit),
    };
  }

  private async getTrending(options: RankingOptions) {
    // Calculate trending scores and cache in Redis
    const trendingScores = await this.calculateTrendingScores();
    
    const where = this.buildWhereClause(options);
    
    // Get all matching ideas
    const [ideas, total] = await Promise.all([
      prisma.ideas.findMany({
        where,
        include: this.getIncludeClause(),
      }),
      prisma.ideas.count({ where }),
    ]);
    
    // Add trending scores and sort
    const ideasWithScores = ideas
      .map(idea => ({
        ...idea,
        trendingScore: trendingScores[idea.id] || 0,
      }))
      .sort((a, b) => b.trendingScore - a.trendingScore);
    
    // Paginate
    const paginatedIdeas = ideasWithScores.slice(
      (options.page - 1) * options.limit,
      options.page * options.limit
    );

    return {
      ideas: paginatedIdeas,
      total,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(total / options.limit),
    };
  }

  private async getTopRated(options: RankingOptions) {
    const where = this.buildWhereClause(options);
    
    const [ideas, total] = await Promise.all([
      prisma.ideas.findMany({
        where,
        orderBy: { overallScore: 'desc' },
        skip: (options.page - 1) * options.limit,
        take: options.limit,
        include: this.getIncludeClause(),
      }),
      prisma.ideas.count({ where }),
    ]);

    return {
      ideas,
      total,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(total / options.limit),
    };
  }

  private async getMostPopular(options: RankingOptions) {
    const where = this.buildWhereClause(options);
    
    // Get all matching ideas
    const [ideas, total] = await Promise.all([
      prisma.ideas.findMany({
        where,
        include: this.getIncludeClause(),
      }),
      prisma.ideas.count({ where }),
    ]);
    
    // Calculate popularity score: views + likes*2 + comments*3 + unlocks*5
    const ideasWithPopularity = ideas
      .map(idea => ({
        ...idea,
        popularityScore: 
          idea.viewCount +
          idea.likeCount * 2 +
          idea.commentCount * 3 +
          idea.unlockCount * 5,
      }))
      .sort((a, b) => b.popularityScore - a.popularityScore);
    
    // Paginate
    const paginatedIdeas = ideasWithPopularity.slice(
      (options.page - 1) * options.limit,
      options.page * options.limit
    );

    return {
      ideas: paginatedIdeas,
      total,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(total / options.limit),
    };
  }

  async calculateTrendingScores(): Promise<Record<string, number>> {
    try {
      // Check Redis cache first
      const cached = await redis.get('trending_scores');
      if (cached) {
        logger.debug('Using cached trending scores');
        return JSON.parse(cached);
      }

      logger.info('Calculating fresh trending scores...');

      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      // Get ideas published in the last 7 days with their engagement
      const ideas = await prisma.ideas.findMany({
        where: {
          publishedAt: { gte: sevenDaysAgo },
          isPublished: true,
        },
        include: {
          likes: {
            where: { createdAt: { gte: sevenDaysAgo } },
            select: { createdAt: true },
          },
          comments: {
            where: { createdAt: { gte: sevenDaysAgo } },
            select: { createdAt: true },
          },
          unlocks: {
            where: { unlockedAt: { gte: sevenDaysAgo } },
            select: { unlockedAt: true },
          },
        },
      });

      const scores: Record<string, number> = {};
      
      for (const idea of ideas) {
        // Calculate engagement by day with time decay
        const dailyEngagement = this.calculateDailyEngagement(idea, sevenDaysAgo);
        
        // Apply weights and time decay
        let trendingScore = 0;
        for (let day = 0; day < 7; day++) {
          const decay = 1.0 - (day * 0.1); // 1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4
          const dayScore = 
            dailyEngagement[day].views * 1 +
            dailyEngagement[day].likes * 3 +
            dailyEngagement[day].comments * 5 +
            dailyEngagement[day].unlocks * 10;
          
          trendingScore += dayScore * decay;
        }
        
        scores[idea.id] = trendingScore;
      }

      // Cache for 1 hour
      await redis.setex('trending_scores', 3600, JSON.stringify(scores));
      
      logger.info(`Calculated trending scores for ${Object.keys(scores).length} ideas`);

      return scores;
    } catch (error) {
      logger.error('Error calculating trending scores:', error);
      return {};
    }
  }

  private calculateDailyEngagement(idea: any, startDate: Date): DailyEngagement[] {
    const dailyEngagement: DailyEngagement[] = Array(7).fill(null).map(() => ({
      views: 0,
      likes: 0,
      comments: 0,
      unlocks: 0,
    }));

    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    // Distribute views evenly across days (we don't have per-day view data)
    const avgViewsPerDay = Math.floor(idea.viewCount / 7);
    for (let i = 0; i < 7; i++) {
      dailyEngagement[i].views = avgViewsPerDay;
    }

    // Count likes by day
    for (const like of idea.likes) {
      const dayIndex = Math.floor((now - like.createdAt.getTime()) / oneDayMs);
      if (dayIndex >= 0 && dayIndex < 7) {
        dailyEngagement[dayIndex].likes++;
      }
    }

    // Count comments by day
    for (const comment of idea.comments) {
      const dayIndex = Math.floor((now - comment.createdAt.getTime()) / oneDayMs);
      if (dayIndex >= 0 && dayIndex < 7) {
        dailyEngagement[dayIndex].comments++;
      }
    }

    // Count unlocks by day
    for (const unlock of idea.unlocks) {
      const dayIndex = Math.floor((now - unlock.unlockedAt.getTime()) / oneDayMs);
      if (dayIndex >= 0 && dayIndex < 7) {
        dailyEngagement[dayIndex].unlocks++;
      }
    }

    return dailyEngagement;
  }

  private buildWhereClause(options: RankingOptions): any {
    const where: any = {
      isPublished: true,
      submissionStatus: 'approved',
    };

    if (options.category) {
      where.category = options.category;
    }

    if (options.tier && options.tier !== 'all') {
      where.tier = options.tier;
    }

    return where;
  }

  private getIncludeClause() {
    return {
      contributor: {
        select: {
          id: true,
          username: true,
          profileImageUrl: true,
          reputationScore: true,
        },
      },
    };
  }
}

export const rankingService = new RankingService();
