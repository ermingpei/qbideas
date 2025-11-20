import { Router, Response, Request } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { ErrorCodes } from '@qbideas/shared';
import { z } from 'zod';

const router = Router();

// Validation schemas
const signupSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Create a new user account
 *     description: Register a new user with username, email, and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 50
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error or user already exists
 */
router.post('/signup', asyncHandler(async (req: Request, res: Response) => {
  // Validate request body
  const validation = signupSchema.safeParse(req.body);
  
  if (!validation.success) {
    throw new AppError('Invalid input data', 400, ErrorCodes.VALIDATION_ERROR);
  }

  const { username, email, password } = validation.data;

  // Check if user already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email },
        { username },
      ],
    },
  });

  if (existingUser) {
    if (existingUser.email === email) {
      throw new AppError('Email already registered', 400, ErrorCodes.VALIDATION_ERROR);
    }
    if (existingUser.username === username) {
      throw new AppError('Username already taken', 400, ErrorCodes.VALIDATION_ERROR);
    }
  }

  // Hash password
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // Create user
  const user = await prisma.user.create({
    data: {
      username,
      email,
      passwordHash,
      emailVerified: true, // Auto-verify for now (implement email verification later)
    },
    select: {
      id: true,
      username: true,
      email: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET || 'dev-secret-key',
    { expiresIn: '7d' }
  );

  res.status(201).json({
    success: true,
    data: {
      user,
      token,
    },
    message: 'Account created successfully',
  });
}));

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login to an existing account
 *     description: Authenticate with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  // Validate request body
  const validation = loginSchema.safeParse(req.body);
  
  if (!validation.success) {
    throw new AppError('Invalid input data', 400, ErrorCodes.VALIDATION_ERROR);
  }

  const { email, password } = validation.data;

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError('Invalid email or password', 401, ErrorCodes.AUTH_INVALID_CREDENTIALS);
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401, ErrorCodes.AUTH_INVALID_CREDENTIALS);
  }

  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET || 'dev-secret-key',
    { expiresIn: '7d' }
  );

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        emailVerified: user.emailVerified,
        profileImageUrl: user.profileImageUrl,
        reputationScore: user.reputationScore,
      },
      token,
    },
    message: 'Login successful',
  });
}));

/**
 * @swagger
 * /api/auth/verify-token:
 *   post:
 *     summary: Verify JWT token
 *     description: Check if a JWT token is valid
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token is valid
 *       401:
 *         description: Token is invalid or expired
 */
router.post('/verify-token', asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token) {
    throw new AppError('Token required', 400, ErrorCodes.VALIDATION_ERROR);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        email: true,
        emailVerified: true,
        profileImageUrl: true,
        reputationScore: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 401, ErrorCodes.AUTH_UNAUTHORIZED);
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    throw new AppError('Invalid or expired token', 401, ErrorCodes.AUTH_TOKEN_EXPIRED);
  }
}));

export default router;
