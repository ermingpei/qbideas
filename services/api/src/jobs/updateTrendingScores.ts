import { rankingService } from '../services/ranking.service';
import logger from '../utils/logger';

export async function updateTrendingScores(): Promise<void> {
  try {
    logger.info('Starting trending scores update...');
    await rankingService.calculateTrendingScores();
    logger.info('Trending scores updated successfully');
  } catch (error) {
    logger.error('Error updating trending scores:', error);
  }
}

export function startTrendingScoreUpdater() {
  logger.info('Starting trending score updater...');

  // Run every hour
  setInterval(updateTrendingScores, 60 * 60 * 1000);
  
  // Run immediately on startup
  updateTrendingScores();
}
