"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import PostCard, { Post } from "@/components/post-card";

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [post, setPost] = useState<Post | null>(null);
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
          style={{ borderColor: "#a8a6ff", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-8 text-center">
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
          Post not found or you don&apos;t have permission to view it.
        </p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-sm underline"
          style={{ color: "#a8a6ff" }}
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
        style={{ color: "rgba(255,255,255,0.45)" }}
      >
        ← Back
      </button>
      <PostCard
        post={post}
        currentUserId={currentUserId}
        onDelete={() => router.back()}
      />
    </div>
  );
}
