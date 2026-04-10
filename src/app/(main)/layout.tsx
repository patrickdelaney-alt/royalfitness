import { Suspense } from "react";
import { redirect } from "next/navigation";
import { safeAuth } from "@/lib/safe-auth";
import { BottomNav } from "@/components/bottom-nav";
import { BOTTOM_NAV_HEIGHT } from "@/components/bottom-nav.constants";
import { NotificationCountProvider } from "@/components/notification-count-provider";

// Auth check requires request headers — never cache this layout statically.
export const dynamic = "force-dynamic";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await safeAuth();

  if (!session?.user?.id) {
    redirect("/signin");
  }

  return (
    <NotificationCountProvider>
      <div className="flex min-h-[100dvh] flex-col bg-background">
        <main
          className="flex-1"
          style={{
            paddingTop: "env(safe-area-inset-top)",
            paddingBottom: BOTTOM_NAV_HEIGHT,
          }}
        >
          {children}
        </main>
        <Suspense fallback={<div style={{ height: BOTTOM_NAV_HEIGHT }} />}>
          <BottomNav />
        </Suspense>
      </div>
    </NotificationCountProvider>
  );
}
