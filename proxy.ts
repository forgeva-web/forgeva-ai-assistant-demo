// @/proxy.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Routes that require a signed in user
const isProtectedRoute = createRouteMatcher([
  '/api/index-site',
  '/api/chat(.*)',
]);

// Sign-in and sign-up pages must remain public
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/sites(.*)',
  '/api/revalidate',
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req) && isProtectedRoute(req)) {
    await auth.protect();
  }
  return;
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
