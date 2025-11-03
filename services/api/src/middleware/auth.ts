import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';
import { AppError, ErrorCodes } from './errorHandler';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
    emailVerified: boolean;
  };
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Access token required', 401, ErrorCodes.AUTH_UNAUTHORIZED);
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      throw new AppError('Access token required', 401, ErrorCodes.AUTH_UNAUTHORIZED);
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    if (!decoded || !decoded.userId) {
      throw new AppError('Invalid token', 401, ErrorCodes.AUTH_TOKEN_EXPIRED);
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        email: true,
        emailVerified: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 401, ErrorCodes.AUTH_UNAUTHORIZED);
    }

    if (!user.emailVerified) {
      throw new AppError('Email not verified', 401, ErrorCodes.AUTH_EMAIL_NOT_VERIFIED);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token', 401, ErrorCodes.AUTH_TOKEN_EXPIRED));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('Token expired', 401, ErrorCodes.AUTH_TOKEN_EXPIRED));
    } else {
      next(error);
    }
  }
};

export const optionalAuthMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      return next();
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    if (decoded && decoded.userId) {
      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          username: true,
          email: true,
          emailVerified: true,
        },
      });

      if (user && user.emailVerified) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // For optional auth, we don't throw errors, just continue without user
    next();
  }
};

export const adminMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401, ErrorCodes.AUTH_UNAUTHORIZED);
    }

    // Check if user is admin (you can implement your own admin logic)
    // For now, we'll check if the user email is in admin list
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(email => email.trim());
    
    if (!adminEmails.includes(req.user.email)) {
      throw new AppError('Admin access required', 403, ErrorCodes.AUTH_UNAUTHORIZED);
    }

    next();
  } catch (error) {
    next(error);
  }
};