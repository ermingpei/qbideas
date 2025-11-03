// User types
export interface User {
  id: string;
  username: string;
  email: string;
  emailVerified: boolean;
  profileImageUrl?: string;
  bio?: string;
  reputationScore: number;
  totalEarnings: number;
  availableBalance: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  accessToken: string;
  refreshToken: string;
}

// Idea types
export interface Idea {
  id: string;
  title: string;
  slug: string;
  teaserDescription: string;
  fullDescription: string;
  category: string;
  tier: 'regular' | 'premium';
  source: 'ai' | 'community';
  contributorId?: string;
  contributor?: User;
  
  // Comprehensive data
  executiveSummary?: IdeaExecutiveSummary;
  problemStatement?: IdeaProblemStatement;
  solutionOverview?: IdeaSolutionOverview;
  targetMarket?: IdeaTargetMarket;
  competitiveAnalysis?: IdeaCompetitiveAnalysis;
  technicalArchitecture?: IdeaTechnicalArchitecture;
  goToMarketStrategy?: IdeaGoToMarketStrategy;
  financialProjections?: IdeaFinancialProjections;
  riskAssessment?: IdeaRiskAssessment;
  
  // Scoring
  marketPotentialScore: number;
  technicalFeasibilityScore: number;
  innovationScore: number;
  overallScore: number;
  
  // Engagement metrics
  viewCount: number;
  likeCount: number;
  commentCount: number;
  unlockCount: number;
  
  // Metadata
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  isValidated: boolean;
  unlockPrice: number;
}

export interface IdeaExecutiveSummary {
  keyHighlights: string[];
  valueProposition: string;
  targetAudience: string;
  marketOpportunity: string;
}

export interface IdeaProblemStatement {
  problemDescription: string;
  currentSolutions: string[];
  marketGap: string;
  painPoints: string[];
  supportingData: string[];
}

export interface IdeaSolutionOverview {
  solutionDescription: string;
  keyFeatures: string[];
  uniqueValueProposition: string;
  differentiationFactors: string[];
  technologyApproach: string;
}

export interface IdeaTargetMarket {
  primaryMarket: string;
  secondaryMarkets: string[];
  marketSize: {
    tam: number; // Total Addressable Market
    sam: number; // Serviceable Addressable Market
    som: number; // Serviceable Obtainable Market
  };
  userPersonas: UserPersona[];
  geographicMarkets: string[];
}

export interface UserPersona {
  name: string;
  demographics: string;
  painPoints: string[];
  motivations: string[];
  behaviors: string[];
}

export interface IdeaCompetitiveAnalysis {
  directCompetitors: Competitor[];
  indirectCompetitors: Competitor[];
  competitiveAdvantages: string[];
  threats: string[];
  marketPositioning: string;
}

export interface Competitor {
  name: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  marketShare?: number;
  funding?: number;
}

export interface IdeaTechnicalArchitecture {
  technologyStack: string[];
  systemArchitecture: string;
  scalabilityConsiderations: string[];
  securityRequirements: string[];
  integrationRequirements: string[];
  developmentComplexity: 'low' | 'medium' | 'high';
  estimatedDevelopmentTime: string;
}

export interface IdeaGoToMarketStrategy {
  launchStrategy: string;
  marketingChannels: string[];
  pricingStrategy: string;
  salesStrategy: string;
  partnershipOpportunities: string[];
  milestones: Milestone[];
}

export interface Milestone {
  name: string;
  description: string;
  timeline: string;
  successMetrics: string[];
}

export interface IdeaFinancialProjections {
  developmentCosts: {
    initial: number;
    ongoing: number;
    breakdown: CostBreakdown[];
  };
  revenueProjections: {
    year1: number;
    year2: number;
    year3: number;
    revenueStreams: RevenueStream[];
  };
  profitabilityTimeline: string;
  fundingRequirements: number;
  roi: number;
}

export interface CostBreakdown {
  category: string;
  amount: number;
  description: string;
}

export interface RevenueStream {
  name: string;
  description: string;
  projectedRevenue: number;
  confidence: 'low' | 'medium' | 'high';
}

export interface IdeaRiskAssessment {
  technicalRisks: Risk[];
  marketRisks: Risk[];
  competitiveRisks: Risk[];
  regulatoryRisks: Risk[];
  mitigationStrategies: string[];
  overallRiskLevel: 'low' | 'medium' | 'high';
}

export interface Risk {
  description: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
}

// Comment types
export interface Comment {
  id: string;
  ideaId: string;
  userId: string;
  username: string;
  userProfileImage?: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  likeCount: number;
  replyCount: number;
  parentCommentId?: string;
}

// Premium Service types
export interface PremiumService {
  id: string;
  name: string;
  description: string;
  price: number;
  deliveryTimeDays: number;
  isActive: boolean;
  createdAt: Date;
}

export interface ServiceRequest {
  id: string;
  userId: string;
  ideaId: string;
  serviceId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  paymentAmount: number;
  stripePaymentIntentId?: string;
  reportUrl?: string;
  requestedAt: Date;
  completedAt?: Date;
  deadline: Date;
}

// Transaction types
export interface Transaction {
  id: string;
  userId: string;
  type: 'idea_unlock' | 'service_purchase' | 'contributor_earning' | 'payout';
  amount: number;
  description: string;
  referenceId?: string;
  stripeTransactionId?: string;
  createdAt: Date;
}

// Payout types
export interface Payout {
  id: string;
  userId: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  stripePayoutId?: string;
  requestedAt: Date;
  completedAt?: Date;
  failureReason?: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  requestId: string;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Filter types
export interface IdeaFilters {
  category?: string;
  tier?: 'regular' | 'premium' | 'all';
  source?: 'ai' | 'community' | 'all';
  dateRange?: {
    start: Date;
    end: Date;
  };
  minScore?: number;
  search?: string;
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  type: 'comment_reply' | 'idea_published' | 'service_completed' | 'earning_received';
  title: string;
  message: string;
  link: string;
  read: boolean;
  createdAt: Date;
}

// Analytics types
export interface AnalyticsEvent {
  eventId: string;
  userId?: string;
  sessionId: string;
  eventType: string;
  eventProperties: Record<string, any>;
  pageUrl: string;
  referrer?: string;
  userAgent: string;
  ipAddress: string;
  timestamp: Date;
}

export interface DailyMetrics {
  date: Date;
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  ideasPublished: number;
  ideasUnlocked: number;
  servicesPurchased: number;
  revenue: number;
  avgSessionDuration: number;
}

// AI Pipeline types
export interface IdeaGenerationRequest {
  count: number;
  categories?: string[];
  trends?: string[];
  excludeIds?: string[];
}

export interface IdeaCandidate {
  title: string;
  description: string;
  category: string;
  marketPotential: number;
  technicalFeasibility: number;
  innovation: number;
  clarity: number;
  trendAlignment: number;
  overallScore: number;
}

export interface ResearchData {
  marketSize?: number;
  competitors?: string[];
  trends?: string[];
  technologies?: string[];
  risks?: string[];
}

// Webhook types
export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
  created: number;
}

// Configuration types
export interface AppConfig {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  redisUrl: string;
  jwtSecret: string;
  stripeSecretKey: string;
  openaiApiKey: string;
  anthropicApiKey: string;
  corsOrigin: string;
}

// Error codes
export enum ErrorCodes {
  // Authentication errors
  AUTH_INVALID_CREDENTIALS = 'AUTH_001',
  AUTH_EMAIL_NOT_VERIFIED = 'AUTH_002',
  AUTH_TOKEN_EXPIRED = 'AUTH_003',
  AUTH_UNAUTHORIZED = 'AUTH_004',
  
  // Idea errors
  IDEA_NOT_FOUND = 'IDEA_001',
  IDEA_ALREADY_UNLOCKED = 'IDEA_002',
  IDEA_INSUFFICIENT_QUALITY = 'IDEA_003',
  IDEA_DUPLICATE = 'IDEA_004',
  
  // Payment errors
  PAYMENT_FAILED = 'PAY_001',
  PAYMENT_INSUFFICIENT_FUNDS = 'PAY_002',
  PAYMENT_INVALID_AMOUNT = 'PAY_003',
  
  // Service errors
  SERVICE_UNAVAILABLE = 'SVC_001',
  SERVICE_NOT_FOUND = 'SVC_002',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_001',
  
  // Validation errors
  VALIDATION_ERROR = 'VAL_001',
  
  // Server errors
  INTERNAL_SERVER_ERROR = 'SRV_001',
  DATABASE_ERROR = 'SRV_002',
  EXTERNAL_API_ERROR = 'SRV_003'
}