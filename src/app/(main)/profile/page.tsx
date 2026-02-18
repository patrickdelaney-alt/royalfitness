import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function ProfileRedirect() {
  const session = await auth();

  if (!session?.user?.username) {
    redirect("/feed");
  }

  redirect(`/profile/${session.user.username}`);
}
