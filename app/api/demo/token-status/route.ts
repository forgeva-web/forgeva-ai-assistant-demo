// @/app/api/(demo)/token-status/route.ts
import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma/client';
import { auth, clerkClient } from '@clerk/nextjs/server';

export async function GET() {
  const { userId } = await auth();
  console.log(`userId: ${userId}`);
  if (!userId) return NextResponse.json({ allowed: false });

  let visitor = await prisma.demoVisitor.findUnique({
    where: { clerkId: userId },
  });

  if (!visitor) {
    console.log(
      `[token-status] No visitor record for user — fetching from Clerk`
    );

    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);

    const primaryEmail =
      clerkUser.emailAddresses.find(
        (e) => e.id === clerkUser.primaryEmailAddressId
      )?.emailAddress ??
      clerkUser.emailAddresses[0]?.emailAddress ??
      '';

    visitor = await prisma.demoVisitor.create({
      data: {
        clerkId: userId,
        email: primaryEmail,
        firstName: clerkUser.firstName ?? '',
        lastName: clerkUser.lastName ?? '',
        tokenBudget: parseInt(process.env.DEMO_TOKEN_BUDGET ?? '50000'),
        tokensUsed: 0,
      },
    });

    console.log(`[token-status] Created visitor for ${primaryEmail}`);
  }

  console.log(
    `[token-status] — ${visitor.email} — ${visitor.tokensUsed} tokens used + ${visitor.tokenBudget - visitor.tokensUsed} remaining`
  );

  return NextResponse.json({
    tokensUsed: visitor.tokensUsed,
    tokenBudget: visitor.tokenBudget,
    remaining: visitor.tokenBudget - visitor.tokensUsed,
    percent: Math.round((visitor.tokensUsed / visitor.tokenBudget) * 100),
  });
}
