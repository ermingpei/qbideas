import { Router, Request, Response } from 'express';
import { prisma, redis } from '../index';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the API service and its dependencies
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: Uptime in seconds
 *                 version:
 *                   type: string
 *                 dependencies:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: string
 *                       example: healthy
 *                     redis:
 *                       type: string
 *                       example: healthy
 *       503:
 *         description: Service is unhealthy
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  // Check database connection
  let databaseStatus = 'healthy';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    databaseStatus = 'unhealthy';
  }
  
  // Check Redis connection
  let redisStatus = 'healthy';
  try {
    await redis.ping();
  } catch (error) {
    redisStatus = 'unhealthy';
  }
  
  const responseTime = Date.now() - startTime;
  const isHealthy = databaseStatus === 'healthy' && redisStatus === 'healthy';
  
  const healthCheck = {
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    responseTime: `${responseTime}ms`,
    dependencies: {
      database: databaseStatus,
      redis: redisStatus,
    },
    environment: process.env.NODE_ENV || 'development',
  };
  
  res.status(isHealthy ? 200 : 503).json(healthCheck);
}));

/**
 * @swagger
 * /health/ready:
 *   get:
 *     summary: Readiness check endpoint
 *     description: Returns whether the service is ready to accept requests
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is ready
 *       503:
 *         description: Service is not ready
 */
router.get('/ready', asyncHandler(async (req: Request, res: Response) => {
  try {
    // Check if we can perform basic operations
    await prisma.$queryRaw`SELECT 1`;
    await redis.ping();
    
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}));

/**
 * @swagger
 * /health/live:
 *   get:
 *     summary: Liveness check endpoint
 *     description: Returns whether the service is alive
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is alive
 */
router.get('/live', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;