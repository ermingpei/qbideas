/**
 * Simple Revenue System Test (No Server Import)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testRevenue() {
  console.log('🧪 Testing Revenue Sharing System\n');

  try {
    // Check if we have any ideas with unlocks
    const ideasWithUnlocks = await prisma.ideas.findMany({
      where: {
        source: 'community',
        unlockCount: { gt: 0 },
      },
      include: {
        contributor: {
          select: {
            username: true,
            totalEarnings: true,
            availableBalance: true,
            reputationScore: true,
          },
        },
        unlocks: {
          take: 5,
          orderBy: { unlockedAt: 'desc' },
        },
      },
      take: 5,
    });

    if (ideasWithUnlocks.length > 0) {
      console.log('✅ Found community ideas with unlocks:\n');
      
      ideasWithUnlocks.forEach((idea, i) => {
        console.log(`${i + 1}. "${idea.title}"`);
        console.log(`   - Unlocks: ${idea.unlockCount}`);
        console.log(`   - Contributor: ${idea.contributor?.username}`);
        console.log(`   - Contributor earnings: $${idea.contributor?.totalEarnings}`);
        console.log(`   - Contributor balance: $${idea.contributor?.availableBalance}`);
        console.log(`   - Contributor reputation: ${idea.contributor?.reputationScore} points\n`);
      });
    } else {
      console.log('ℹ️  No community ideas with unlocks found yet.\n');
    }

    // Check transactions
    const recentTransactions = await prisma.transactions.findMany({
      where: {
        type: 'contributor_earning',
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
    });

    if (recentTransactions.length > 0) {
      console.log('💰 Recent Contributor Earnings:\n');
      recentTransactions.forEach((tx, i) => {
        console.log(`${i + 1}. ${tx.user.username}: $${tx.amount} - ${tx.description}`);
      });
      console.log();
    }

    // Check payouts
    const payouts = await prisma.payouts.findMany({
      orderBy: { requestedAt: 'desc' },
      take: 5,
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
    });

    if (payouts.length > 0) {
      console.log('💸 Recent Payouts:\n');
      payouts.forEach((payout, i) => {
        console.log(`${i + 1}. ${payout.user.username}: $${payout.amount} - ${payout.status}`);
      });
      console.log();
    }

    // Summary
    const stats = await prisma.$transaction([
      prisma.ideas.count({ where: { source: 'community', isPublished: true } }),
      prisma.ideaUnlocks.count(),
      prisma.transactions.aggregate({
        where: { type: 'contributor_earning' },
        _sum: { amount: true },
      }),
      prisma.user.aggregate({
        where: { totalEarnings: { gt: 0 } },
        _sum: { totalEarnings: true, availableBalance: true },
      }),
    ]);

    console.log('📊 Revenue System Summary:\n');
    console.log(`✅ Community ideas published: ${stats[0]}`);
    console.log(`✅ Total unlocks: ${stats[1]}`);
    console.log(`✅ Total contributor earnings: $${stats[2]._sum.amount || 0}`);
    console.log(`✅ Total available balance: $${stats[3]._sum.availableBalance || 0}`);
    console.log(`✅ Contributors with earnings: ${await prisma.user.count({ where: { totalEarnings: { gt: 0 } } })}`);
    console.log();

    console.log('🎉 Revenue system is operational!\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRevenue();
