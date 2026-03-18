"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import PostCard, { Post } from "@/components/post-card";

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [post, setPost] = useState<Post | null>(null);

  const handleEdit = useCallback((id: string, fields: { caption: string | null; visibility: string; workoutName?: string; mealName?: string; activityType?: string }) => {
    setPost((p) => {
      if (!p || p.id !== id) return p;
      return {
        ...p,
        caption: fields.caption,
        visibility: fields.visibility,
        workoutDetail: fields.workoutName && p.workoutDetail ? { ...p.workoutDetail, workoutName: fields.workoutName } : p.workoutDetail,
        mealDetail: fields.mealName && p.mealDetail ? { ...p.mealDetail, mealName: fields.mealName } : p.mealDetail,
        wellnessDetail: fields.activityType && p.wellnessDetail ? { ...p.wellnessDetail, activityType: fields.activityType } : p.wellnessDetail,
      };
    });
  }, []);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((s) => setCurrentUserId(s?.user?.id ?? undefined))
      .catch(() => {});
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/posts/${id}`);
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setPost(data);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div
          className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: "#528531", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-8 text-center">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Post not found or you don&apos;t have permission to view it.
        </p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-sm underline"
          style={{ color: "#528531" }}
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-8">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 mb-4 text-sm"
        style={{ color: "var(--text-muted)" }}
      >
        ← Back
      </button>
      <PostCard
        post={post}
        currentUserId={currentUserId}
        onDelete={() => router.back()}
        onEdit={handleEdit}
      />
    </div>
  );
}
