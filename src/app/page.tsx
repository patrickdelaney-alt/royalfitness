import { redirect } from "next/navigation";
import { safeAuth } from "@/lib/safe-auth";

export const dynamic = "force-dynamic";

export default async function RootPage() {
  const session = await safeAuth();

  if (session) {
    redirect("/feed");
  } else {
    redirect("/signin");
  }
}
