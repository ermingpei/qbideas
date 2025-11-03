import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { ApiError, ErrorCodes } from '../types';

// JWT utilities
export const generateToken = (payload: string | object | Buffer, secret: string, expiresIn: string = '1h'): string => {
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
};

export const verifyToken = (token: string, secret: string): any => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Password utilities
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// Validation schemas
export const userValidation = {
  register: z.object({
    username: z.string()
      .min(3, 'Username must be at least 3 characters')
      .max(50, 'Username must be less than 50 characters')
      .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
    email: z.string().email('Invalid email format'),
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number')
  }),
  
  login: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required')
  }),
  
  updateProfile: z.object({
    username: z.string()
      .min(3, 'Username must be at least 3 characters')
      .max(50, 'Username must be less than 50 characters')
      .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
      .optional(),
    bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
    profileImageUrl: z.string().url('Invalid URL format').optional()
  })
};

export const ideaValidation = {
  create: z.object({
    title: z.string()
      .min(10, 'Title must be at least 10 characters')
      .max(200, 'Title must be less than 200 characters'),
    description: z.string()
      .min(50, 'Description must be at least 50 characters')
      .max(5000, 'Description must be less than 5000 characters'),
    category: z.enum([
      'productivity', 'entertainment', 'education', 'health', 'business',
      'social', 'finance', 'travel', 'food', 'lifestyle', 'technology', 'other'
    ]),
    problemStatement: z.string()
      .min(20, 'Problem statement must be at least 20 characters')
      .max(1000, 'Problem statement must be less than 1000 characters'),
    targetAudience: z.string()
      .min(10, 'Target audience must be at least 10 characters')
      .max(500, 'Target audience must be less than 500 characters'),
    proposedSolution: z.string()
      .min(20, 'Proposed solution must be at least 20 characters')
      .max(2000, 'Proposed solution must be less than 2000 characters')
  }),
  
  filters: z.object({
    category: z.string().optional(),
    tier: z.enum(['regular', 'premium', 'all']).optional(),
    source: z.enum(['ai', 'community', 'all']).optional(),
    search: z.string().optional(),
    minScore: z.number().min(0).max(10).optional(),
    page: z.number().min(1).optional(),
    limit: z.number().min(1).max(100).optional(),
    sortBy: z.enum(['publishedAt', 'overallScore', 'likeCount', 'viewCount']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional()
  })
};

export const commentValidation = {
  create: z.object({
    content: z.string()
      .min(1, 'Comment cannot be empty')
      .max(1000, 'Comment must be less than 1000 characters'),
    parentCommentId: z.string().uuid().optional()
  })
};

// Utility functions
export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

export const generateUniqueSlug = async (
  title: string,
  checkExists: (slug: string) => Promise<boolean>
): Promise<string> => {
  let baseSlug = generateSlug(title);
  let slug = baseSlug;
  let counter = 1;
  
  while (await checkExists(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
};

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

export const calculateReadingTime = (text: string): number => {
  const wordsPerMinute = 200;
  const wordCount = text.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const sanitizeHtml = (html: string): string => {
  // Basic HTML sanitization - in production, use a proper library like DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
};

// Error handling utilities
export const createApiError = (
  code: ErrorCodes,
  message: string,
  details?: any,
  requestId?: string
): ApiError => {
  return {
    code,
    message,
    details,
    timestamp: new Date().toISOString(),
    requestId: requestId || generateRequestId()
  };
};

export const generateRequestId = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

// Date utilities
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

export const formatDateTime = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

export const getRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  return `${Math.floor(diffInSeconds / 31536000)}y ago`;
};

// Pagination utilities
export const calculatePagination = (page: number, limit: number, total: number) => {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext,
    hasPrev
  };
};

// Rate limiting utilities
export const createRateLimitKey = (identifier: string, action: string): string => {
  return `rate_limit:${action}:${identifier}`;
};

// File utilities
export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

export const isValidImageFile = (filename: string): boolean => {
  const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  const extension = getFileExtension(filename);
  return validExtensions.includes(extension);
};

export const generateFileName = (originalName: string, prefix?: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = getFileExtension(originalName);
  const baseName = originalName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '-');
  
  return prefix 
    ? `${prefix}-${baseName}-${timestamp}-${random}.${extension}`
    : `${baseName}-${timestamp}-${random}.${extension}`;
};

// Search utilities
export const normalizeSearchQuery = (query: string): string => {
  return query
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ');
};

export const highlightSearchTerms = (text: string, query: string): string => {
  if (!query) return text;
  
  const normalizedQuery = normalizeSearchQuery(query);
  const terms = normalizedQuery.split(' ').filter(term => term.length > 0);
  
  let highlightedText = text;
  terms.forEach(term => {
    const regex = new RegExp(`(${term})`, 'gi');
    highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
  });
  
  return highlightedText;
};

// Analytics utilities
export const trackEvent = (eventType: string, properties: Record<string, any> = {}) => {
  // This would integrate with your analytics service
  console.log('Analytics Event:', { eventType, properties, timestamp: new Date() });
};

// Configuration utilities
export const getEnvVar = (name: string, defaultValue?: string): string => {
  const value = process.env[name];
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${name} is required`);
  }
  return value || defaultValue!;
};

export const getEnvVarAsNumber = (name: string, defaultValue?: number): number => {
  const value = process.env[name];
  if (!value && defaultValue === undefined) {
    throw new Error(`Environment variable ${name} is required`);
  }
  return value ? parseInt(value, 10) : defaultValue!;
};

export const getEnvVarAsBoolean = (name: string, defaultValue?: boolean): boolean => {
  const value = process.env[name];
  if (!value && defaultValue === undefined) {
    throw new Error(`Environment variable ${name} is required`);
  }
  return value ? value.toLowerCase() === 'true' : defaultValue!;
};