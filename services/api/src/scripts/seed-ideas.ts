import { PrismaClient } from '@prisma/client';
import slugify from 'slugify';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

const sampleIdeas = [
  {
    title: 'AI-Powered Code Review Assistant',
    teaserDescription: 'Automated code review tool that uses AI to catch bugs, suggest improvements, and enforce best practices before merging PRs.',
    category: 'devtools',
    tags: ['ai', 'developer-tools', 'code-quality', 'automation'],
    tier: 'regular',
    difficulty: 'intermediate',
    estimatedCost: 500,
    estimatedTime: 30,
    scores: { market: 8.5, technical: 7.5, innovation: 8.0 },
  },
  {
    title: 'Micro-SaaS Analytics Dashboard',
    teaserDescription: 'Simple, privacy-focused analytics platform specifically designed for micro-SaaS businesses with under 1000 users.',
    category: 'saas',
    tags: ['analytics', 'privacy', 'micro-saas', 'dashboard'],
    tier: 'premium',
    difficulty: 'advanced',
    estimatedCost: 2000,
    estimatedTime: 60,
    scores: { market: 7.5, technical: 8.0, innovation: 7.0 },
  },
  {
    title: 'Meeting Transcript Summarizer',
    teaserDescription: 'Chrome extension that joins your video calls, transcribes them, and generates AI summaries with action items.',
    category: 'chrome_extension',
    tags: ['productivity', 'ai', 'meetings', 'transcription'],
    tier: 'regular',
    difficulty: 'intermediate',
    estimatedCost: 800,
    estimatedTime: 21,
    scores: { market: 9.0, technical: 7.0, innovation: 7.5 },
  },
  {
    title: 'Local Business Review Aggregator',
    teaserDescription: 'Platform that aggregates reviews from Google, Yelp, and Facebook for local businesses into one dashboard.',
    category: 'web_app',
    tags: ['local-business', 'reviews', 'aggregation', 'dashboard'],
    tier: 'regular',
    difficulty: 'beginner',
    estimatedCost: 300,
    estimatedTime: 14,
    scores: { market: 7.0, technical: 6.0, innovation: 6.0 },
  },
  {
    title: 'Freelancer Time Tracking with Invoice Generation',
    teaserDescription: 'Simple time tracking app for freelancers that automatically generates professional invoices based on tracked hours.',
    category: 'productivity',
    tags: ['freelance', 'time-tracking', 'invoicing', 'productivity'],
    tier: 'regular',
    difficulty: 'beginner',
    estimatedCost: 400,
    estimatedTime: 21,
    scores: { market: 7.5, technical: 6.5, innovation: 5.5 },
  },
  {
    title: 'AI Recipe Generator from Ingredients',
    teaserDescription: 'Mobile app that uses AI to suggest recipes based on ingredients you have at home, reducing food waste.',
    category: 'mobile_app',
    tags: ['ai', 'food', 'sustainability', 'mobile'],
    tier: 'premium',
    difficulty: 'intermediate',
    estimatedCost: 1500,
    estimatedTime: 45,
    scores: { market: 8.0, technical: 7.0, innovation: 7.5 },
  },
  {
    title: 'Subscription Tracker & Cancellation Assistant',
    teaserDescription: 'App that tracks all your subscriptions, alerts you before renewals, and helps you cancel unwanted services.',
    category: 'fintech',
    tags: ['finance', 'subscriptions', 'savings', 'automation'],
    tier: 'regular',
    difficulty: 'intermediate',
    estimatedCost: 600,
    estimatedTime: 30,
    scores: { market: 8.5, technical: 7.0, innovation: 6.5 },
  },
  {
    title: 'API Marketplace for Indie Developers',
    teaserDescription: 'Platform where indie developers can sell access to their APIs with built-in billing, rate limiting, and analytics.',
    category: 'marketplace',
    tags: ['api', 'marketplace', 'monetization', 'developers'],
    tier: 'premium',
    difficulty: 'advanced',
    estimatedCost: 3000,
    estimatedTime: 90,
    scores: { market: 7.5, technical: 9.0, innovation: 8.0 },
  },
  {
    title: 'Social Media Content Calendar',
    teaserDescription: 'Visual content calendar for social media managers to plan, schedule, and collaborate on posts across platforms.',
    category: 'social',
    tags: ['social-media', 'content', 'scheduling', 'collaboration'],
    tier: 'regular',
    difficulty: 'intermediate',
    estimatedCost: 700,
    estimatedTime: 30,
    scores: { market: 7.0, technical: 6.5, innovation: 6.0 },
  },
  {
    title: 'No-Code Landing Page Builder for Developers',
    teaserDescription: 'Landing page builder that generates clean, production-ready code (React/Next.js) instead of hosting on their platform.',
    category: 'devtools',
    tags: ['no-code', 'landing-pages', 'code-generation', 'developers'],
    tier: 'premium',
    difficulty: 'advanced',
    estimatedCost: 2500,
    estimatedTime: 75,
    scores: { market: 8.0, technical: 8.5, innovation: 8.5 },
  },
];

async function generateIdeaData(idea: typeof sampleIdeas[0]) {
  const overallScore = (idea.scores.market + idea.scores.technical + idea.scores.innovation) / 3;

  return {
    title: idea.title,
    slug: slugify(idea.title, { lower: true, strict: true }),
    teaserDescription: idea.teaserDescription,
    fullDescription: `${idea.teaserDescription}\n\nThis is a comprehensive solution designed to address a real market need with modern technology and user-centric design.`,
    category: idea.category,
    tags: idea.tags,
    tier: idea.tier,
    source: 'ai',
    submissionStatus: 'approved',
    isFeatured: Math.random() > 0.7,
    difficultyLevel: idea.difficulty,
    marketPotentialScore: idea.scores.market,
    technicalFeasibilityScore: idea.scores.technical,
    innovationScore: idea.scores.innovation,
    overallScore,
    estimatedCost: idea.estimatedCost,
    estimatedLaunchTime: idea.estimatedTime,
    unlockPrice: idea.tier === 'premium' ? 19.99 : 9.99,
    viewCount: Math.floor(Math.random() * 1000),
    likeCount: Math.floor(Math.random() * 100),
    commentCount: Math.floor(Math.random() * 20),
    bookmarkCount: Math.floor(Math.random() * 50),
    buildCount: Math.floor(Math.random() * 10),
    executiveSummary: {
      overview: idea.teaserDescription,
      keyBenefits: [
        'Solves a real problem',
        'Clear monetization path',
        'Scalable architecture',
      ],
      targetAudience: 'Early adopters and tech-savvy users',
    },
    problemStatement: {
      problem: 'Current solutions are either too expensive, too complex, or don\'t exist.',
      impact: 'Users waste time and money on inadequate solutions.',
      opportunity: 'Build a focused, user-friendly alternative.',
    },
    solutionOverview: {
      approach: 'Modern tech stack with focus on user experience',
      keyFeatures: [
        'Core functionality',
        'User dashboard',
        'Analytics and insights',
      ],
      differentiation: 'Simpler, faster, and more affordable than competitors.',
    },
    targetMarket: {
      primaryMarket: 'Small to medium businesses and individuals',
      marketSize: '$100M+ TAM',
      growthRate: '15-20% annually',
    },
    technicalArchitecture: {
      frontend: 'React/Next.js',
      backend: 'Node.js/Express or Python/FastAPI',
      database: 'PostgreSQL',
      hosting: 'Vercel + Railway',
      thirdPartyServices: ['Stripe', 'SendGrid', 'Analytics'],
    },
    executionPlaybook: {
      phase1: {
        name: 'MVP Development',
        duration: '2-4 weeks',
        tasks: [
          'Set up project structure',
          'Build core features',
          'Implement authentication',
          'Add payment integration',
        ],
      },
      phase2: {
        name: 'Beta Launch',
        duration: '1-2 weeks',
        tasks: [
          'Deploy to production',
          'Onboard beta users',
          'Gather feedback',
          'Fix critical bugs',
        ],
      },
      phase3: {
        name: 'Public Launch',
        duration: '1 week',
        tasks: [
          'Marketing campaign',
          'Product Hunt launch',
          'Social media promotion',
          'Monitor metrics',
        ],
      },
    },
    recommendedServices: [
      {
        category: 'hosting',
        service: 'Vercel',
        reason: 'Easy deployment for frontend',
        cost: '$0-20/mo',
      },
      {
        category: 'backend',
        service: 'Railway',
        reason: 'Simple backend hosting',
        cost: '$5-20/mo',
      },
      {
        category: 'database',
        service: 'Supabase',
        reason: 'PostgreSQL with built-in auth',
        cost: '$0-25/mo',
      },
      {
        category: 'payments',
        service: 'Stripe',
        reason: 'Industry standard',
        cost: '2.9% + $0.30 per transaction',
      },
    ],
  };
}

async function seedIdeas() {
  console.log('Seeding ideas...\n');

  for (const ideaData of sampleIdeas) {
    const data = await generateIdeaData(ideaData);
    const idea = await prisma.ideas.upsert({
      where: { slug: data.slug },
      update: data as any,
      create: data as any,
    });

    console.log(`✓ ${data.title}`);
  }

  console.log(`\n${sampleIdeas.length} ideas seeded successfully!`);

  // Print stats
  const stats = await prisma.ideas.groupBy({
    by: ['category'],
    _count: true,
  });

  console.log('\nIdeas by category:');
  stats.forEach(stat => {
    console.log(`  ${stat.category}: ${stat._count}`);
  });
}

seedIdeas()
  .catch((error) => {
    console.error('Error seeding ideas:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
