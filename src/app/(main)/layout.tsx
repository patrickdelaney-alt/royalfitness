import { Suspense } from "react";
import { redirect } from "next/navigation";
import { safeAuth } from "@/lib/safe-auth";
import { BottomNav } from "@/components/bottom-nav";

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
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1 overflow-y-auto pb-16">{children}</main>
      <Suspense fallback={<div className="h-16" />}>
        <BottomNav />
      </Suspense>
    </div>
  );
}
