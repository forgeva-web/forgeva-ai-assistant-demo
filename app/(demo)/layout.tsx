// @/app/(demo)/layout.tsx
import {
  ClerkProvider,
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from '@clerk/nextjs';

import { DemoBanner } from '@/components/demo/DemoBanner';
import { DemoSidebar } from '@/components/demo/DemoSidebar';
import { Button } from '@/components/ui/button';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <div className="flex flex-col min-h-screen">
        {/* Sidebar & conent row fills remaining height */}
        <SidebarProvider className="flex flex-1 overflow-hidden">
          <DemoSidebar />
          <main className="flex flex-col flex-1 overflow-auto">
            <div className="flex items-center h-10 px-4 border-b border-border shrink-0">
              <SidebarTrigger />
            </div>
            <DemoBanner />
            <div className="flex-1">{children}</div>
          </main>
        </SidebarProvider>
      </div>
    </ClerkProvider>
  );
}
