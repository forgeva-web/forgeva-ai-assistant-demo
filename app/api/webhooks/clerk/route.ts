// @/app/api/webhooks/clerk/route.ts
import { NextRequest } from 'next/server';

import { prisma } from '@/lib/prisma/client';
import { verifyWebhook } from '@clerk/nextjs/webhooks';

export async function POST(req: NextRequest) {
  try {
    const evt = await verifyWebhook(req);
    if (evt.type === 'user.created') {
      const { id, email_addresses, first_name, last_name } = evt.data;
      await prisma.demoVisitor.upsert({
        where: { clerkId: id },
        update: {},
        create: {
          clerkId: id,
          email: email_addresses[0]?.email_address ?? '',
          firstName: first_name ?? '',
          lastName: last_name ?? '',
          tokenBudget: parseInt(process.env.DEMOO_TOKEN_BUDGET ?? '50000'),
        },
      });
    }
    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Clerk webhook error:', error);
    return new Response('Webhook error', { status: 400 });
  }
}
