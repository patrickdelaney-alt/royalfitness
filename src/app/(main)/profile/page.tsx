import { redirect } from "next/navigation";
import { safeAuth } from "@/lib/safe-auth";

export default async function ProfileRedirect() {
  const session = await safeAuth();

  if (!session?.user?.username) {
    redirect("/feed");
  }

  redirect(`/profile/${session.user.username}`);
}
