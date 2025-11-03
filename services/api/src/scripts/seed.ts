import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create premium services
  console.log('Creating premium services...');

  // Check if services already exist
  const existingServicesCount = await prisma.premiumServices.count();
  let services = [];

  if (existingServicesCount === 0) {
    services = await Promise.all([
      prisma.premiumServices.create({
        data: {
          name: 'Feasibility Report',
          description: 'Comprehensive feasibility analysis with market validation, technical assessment, and risk evaluation',
          price: 99.00,
          deliveryTimeDays: 3,
        },
      }),
      prisma.premiumServices.create({
        data: {
          name: 'Technical Planning',
          description: 'Detailed technical architecture and implementation plan with technology recommendations',
          price: 149.00,
          deliveryTimeDays: 5,
        },
      }),
      prisma.premiumServices.create({
        data: {
          name: 'Market Research',
          description: 'In-depth market research with competitor analysis, target audience insights, and market sizing',
          price: 199.00,
          deliveryTimeDays: 7,
        },
      }),
      prisma.premiumServices.create({
        data: {
          name: 'Implementation Roadmap',
          description: 'Step-by-step development roadmap with milestones, timelines, and resource requirements',
          price: 129.00,
          deliveryTimeDays: 4,
        },
      }),
      prisma.premiumServices.create({
        data: {
          name: 'Competitive Analysis',
          description: 'Detailed competitive landscape analysis with positioning strategy and differentiation opportunities',
          price: 89.00,
          deliveryTimeDays: 3,
        },
      }),
    ]);
  } else {
    services = await prisma.premiumServices.findMany();
  }

  console.log(`✅ Created ${services.length} premium services`);

  // Create test users
  console.log('Creating test users...');
  const testUsers = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@qbideas.com' },
      update: {},
      create: {
        username: 'admin',
        email: 'admin@qbideas.com',
        passwordHash: await hashPassword('admin123'),
        emailVerified: true,
        bio: 'Platform administrator',
        reputationScore: 100,
      },
    }),
    prisma.user.upsert({
      where: { email: 'john@example.com' },
      update: {},
      create: {
        username: 'john_builder',
        email: 'john@example.com',
        passwordHash: await hashPassword('password123'),
        emailVerified: true,
        bio: 'AI-enabled builder passionate about productivity tools',
        reputationScore: 85,
      },
    }),
    prisma.user.upsert({
      where: { email: 'sarah@example.com' },
      update: {},
      create: {
        username: 'sarah_innovator',
        email: 'sarah@example.com',
        passwordHash: await hashPassword('password123'),
        emailVerified: true,
        bio: 'Innovation enthusiast and startup founder',
        reputationScore: 92,
        totalEarnings: 450.00,
        availableBalance: 320.00,
      },
    }),
  ]);

  console.log(`✅ Created ${testUsers.length} test users`);

  // Create sample ideas
  console.log('Creating sample ideas...');
  const sampleIdeas = [
    {
      title: 'AI-Powered Personal Finance Assistant',
      category: 'finance',
      tier: 'premium' as const,
      source: 'ai' as const,
      teaserDescription: 'An intelligent personal finance assistant that uses AI to analyze spending patterns, predict future expenses, and provide personalized budgeting advice.',
      fullDescription: 'This AI-powered personal finance assistant would revolutionize how individuals manage their money by providing intelligent insights and automated financial planning. The app would connect to bank accounts and credit cards to analyze spending patterns, categorize expenses automatically, and identify areas for potential savings. Using machine learning algorithms, it would predict future expenses based on historical data and seasonal patterns, helping users plan better for upcoming costs. The assistant would also provide personalized investment recommendations based on risk tolerance and financial goals, and send proactive alerts about unusual spending or opportunities to save money.',
      problemStatement: {
        problemDescription: 'Most people struggle with personal finance management, lacking the time and expertise to effectively budget, save, and invest their money.',
        targetAudience: 'Working professionals aged 25-45 who want to improve their financial health but lack the time or knowledge to manage finances effectively.',
        proposedSolution: 'An AI assistant that automates financial analysis and provides personalized, actionable advice to help users achieve their financial goals.',
      },
      marketPotentialScore: 9.2,
      technicalFeasibilityScore: 8.5,
      innovationScore: 8.8,
      overallScore: 8.8,
      unlockPrice: 12.99,
    },
    {
      title: 'Smart Home Energy Optimizer',
      category: 'lifestyle',
      tier: 'regular' as const,
      source: 'ai' as const,
      teaserDescription: 'A smart system that learns your daily routines and automatically optimizes home energy usage to reduce bills while maintaining comfort.',
      fullDescription: 'The Smart Home Energy Optimizer is an intelligent system that learns from your daily routines and preferences to automatically manage your home\'s energy consumption. It integrates with smart thermostats, lighting systems, and appliances to create personalized energy schedules that minimize waste while ensuring comfort. The system uses machine learning to understand when you\'re typically home, your preferred temperatures at different times, and which rooms are used most frequently. It can predict weather patterns and adjust heating/cooling accordingly, dim lights in unused rooms, and even suggest the optimal times to run energy-intensive appliances based on utility rate schedules.',
      marketPotentialScore: 8.1,
      technicalFeasibilityScore: 9.0,
      innovationScore: 7.5,
      overallScore: 8.2,
    },
    {
      title: 'Collaborative Code Review Platform for Remote Teams',
      category: 'productivity',
      tier: 'premium' as const,
      source: 'community' as const,
      contributorId: testUsers[1].id,
      teaserDescription: 'A platform that makes code reviews more efficient and educational for distributed development teams through AI-assisted analysis and collaborative features.',
      fullDescription: 'This platform addresses the challenges of code review in remote development teams by providing AI-assisted code analysis, automated quality checks, and enhanced collaboration tools. The system would integrate with popular version control systems and provide intelligent suggestions for code improvements, potential bugs, and security vulnerabilities. It includes features like asynchronous video explanations, interactive code walkthroughs, and knowledge sharing sessions where senior developers can mentor junior team members through complex code changes.',
      problemStatement: {
        problemDescription: 'Remote development teams struggle with effective code reviews due to time zone differences, lack of context sharing, and difficulty in providing comprehensive feedback.',
        targetAudience: 'Remote software development teams, particularly those with mixed experience levels and distributed across different time zones.',
        proposedSolution: 'A comprehensive platform that combines AI-assisted code analysis with collaborative tools designed specifically for asynchronous code review workflows.',
      },
      marketPotentialScore: 8.7,
      technicalFeasibilityScore: 8.2,
      innovationScore: 8.0,
      overallScore: 8.3,
      unlockPrice: 15.99,
    },
    {
      title: 'Mindful Productivity Timer',
      category: 'productivity',
      tier: 'regular' as const,
      source: 'community' as const,
      contributorId: testUsers[2].id,
      teaserDescription: 'A productivity timer that combines the Pomodoro technique with mindfulness practices to improve focus and reduce burnout.',
      fullDescription: 'The Mindful Productivity Timer reimagines the traditional Pomodoro technique by incorporating mindfulness and well-being practices. Instead of just timing work sessions, it guides users through brief meditation exercises during breaks, suggests breathing techniques to maintain focus, and tracks stress levels throughout the day. The app learns from user behavior to recommend optimal work session lengths and break activities based on the type of work being done and the user\'s energy levels.',
      marketPotentialScore: 7.2,
      technicalFeasibilityScore: 9.5,
      innovationScore: 7.8,
      overallScore: 8.1,
    },
    {
      title: 'AI Recipe Generator for Dietary Restrictions',
      category: 'food',
      tier: 'regular' as const,
      source: 'ai' as const,
      teaserDescription: 'An AI-powered app that creates personalized recipes based on dietary restrictions, available ingredients, and nutritional goals.',
      fullDescription: 'This AI recipe generator solves the daily challenge of meal planning for people with specific dietary needs. Users input their dietary restrictions (gluten-free, vegan, keto, etc.), available ingredients, and nutritional goals, and the AI creates customized recipes with detailed instructions. The app learns from user preferences and feedback to improve suggestions over time, and can even generate shopping lists and meal prep schedules.',
      marketPotentialScore: 8.5,
      technicalFeasibilityScore: 8.8,
      innovationScore: 7.2,
      overallScore: 8.1,
    },
  ];

  const createdIdeas = [];
  for (const ideaData of sampleIdeas) {
    const slug = ideaData.title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');

    const idea = await prisma.ideas.create({
      data: {
        ...ideaData,
        slug,
        viewCount: Math.floor(Math.random() * 1000) + 100,
        likeCount: Math.floor(Math.random() * 50) + 10,
        commentCount: Math.floor(Math.random() * 20) + 2,
        unlockCount: ideaData.tier === 'premium' ? Math.floor(Math.random() * 25) + 5 : 0,
      },
    });
    createdIdeas.push(idea);
  }

  console.log(`✅ Created ${createdIdeas.length} sample ideas`);

  // Create some sample unlocks
  console.log('Creating sample unlocks...');
  const premiumIdeas = createdIdeas.filter(idea => idea.tier === 'premium');
  if (premiumIdeas.length > 0) {
    await prisma.ideaUnlocks.create({
      data: {
        userId: testUsers[1].id,
        ideaId: premiumIdeas[0].id,
        paymentAmount: premiumIdeas[0].unlockPrice,
      },
    });

    // Create corresponding transaction
    await prisma.transactions.create({
      data: {
        userId: testUsers[1].id,
        type: 'idea_unlock',
        amount: premiumIdeas[0].unlockPrice,
        description: `Unlocked idea: ${premiumIdeas[0].title}`,
        referenceId: premiumIdeas[0].id,
      },
    });

    console.log('✅ Created sample unlock and transaction');
  }

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });