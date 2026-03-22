import { prisma } from "@/lib/prisma";
import { safeAuth } from "@/lib/safe-auth";
import { redirect } from "next/navigation";
import EditContent from "./EditContent";

export default async function EditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await safeAuth();
  if (!session?.user?.id) redirect("/login");

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      workoutDetail: {
        include: {
          exercises: {
            include: { sets: { orderBy: { sortOrder: "asc" } } },
            orderBy: { sortOrder: "asc" },
          },
        },
      },
      mealDetail: true,
      wellnessDetail: true,
      gym: { select: { id: true, name: true } },
    },
  });

  if (!post || post.authorId !== session.user.id) redirect("/feed");

  return <EditContent post={post} />;
}
