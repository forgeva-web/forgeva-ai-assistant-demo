// @/lib/demo/token-budget.ts
import { prisma } from '@/lib/prisma/client';
import { auth } from '@clerk/nextjs/server';

export async function checkAndConsumeTokens(estimatedTokens: number): Promise<{
  allowed: boolean;
  remaining: number;
}> {
  // Only enfore in demo mode
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') {
    return { allowed: true, remaining: Infinity };
  }

  const { userId } = await auth();
  if (!userId) return { allowed: false, remaining: 0 };

  const visitor = await prisma.demoVisitor.findUnique({
    where: { clerkId: userId },
  });
  if (!visitor) return { allowed: false, remaining: 0 };

  const remaining = visitor.tokenBudget - visitor.tokensUsed;
  if (remaining < estimatedTokens) {
    return { allowed: false, remaining };
  }

  // Deduct tokens optimistically —— update after the call if actual differs
  await prisma.demoVisitor.update({
    where: { clerkId: userId },
    data: { tokensUsed: { increment: estimatedTokens } },
  });
  return { allowed: true, remaining: remaining - estimatedTokens };
}
