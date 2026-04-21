// @/app/api/cron/reset-demo/route.ts
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma/client';
import { runSeed } from '@/prisma/seed';

export async function GET(request: NextRequest) {
  // Security: Vercel auto-sends CRON_SECRET as Authorization: Bearer
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Safety guard: only runs in demo deployments
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') {
    return NextResponse.json({ error: 'Not demo mode' }, { status: 403 });
  }

  try {
    console.log('[CRON] Starting daily demo reset...');

    // Reset all visitor token budgets to 0
    // This preserves their accounts but gives everyone a fresh daily allocation
    await prisma.demoVisitor.updateMany({
      data: { tokensUsed: 0 },
    });

    // Re-seed demo site data (Mitch's Plumbing back to clean state)
    await runSeed();

    console.log('[CRON] Reset complete');

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[CRON] Reset failed:', error);
    return NextResponse.json(
      { error: 'Reset failed', message: String(error) },
      { status: 500 }
    );
  }
}
