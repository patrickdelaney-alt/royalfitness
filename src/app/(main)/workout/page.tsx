import { redirect } from "next/navigation";
import { safeAuth } from "@/lib/safe-auth";
import { Suspense } from "react";
import WorkoutSession from "./WorkoutSession";

export default async function WorkoutPage() {
  const session = await safeAuth();
  if (!session?.user) redirect("/signin");

  return (
    <Suspense fallback={null}>
      <WorkoutSession />
    </Suspense>
  );
}
