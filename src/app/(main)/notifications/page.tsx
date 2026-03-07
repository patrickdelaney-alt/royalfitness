"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { HiHeart, HiChatBubbleLeft, HiUserPlus, HiUserCircle } from "react-icons/hi2";

interface NotificationActor {
  id: string;
  name: string | null;
  username: string;
  avatarUrl: string | null;
}

interface NotificationPost {
  id: string;
  type: string;
  caption: string | null;
}

interface Notification {
  id: string;
  type: "LIKE" | "COMMENT" | "FOLLOW" | "FOLLOW_REQUEST";
  read: boolean;
  createdAt: string;
  actor: NotificationActor;
  post: NotificationPost | null;
}

const ICON_MAP = {
  LIKE: HiHeart,
  COMMENT: HiChatBubbleLeft,
  FOLLOW: HiUserPlus,
  FOLLOW_REQUEST: HiUserPlus,
};

const ICON_COLOR_MAP = {
  LIKE: "text-red-500",
  COMMENT: "text-blue-500",
  FOLLOW: "text-green-500",
  FOLLOW_REQUEST: "text-amber-500",
};

function getNotificationText(notification: Notification): string {
  const name = notification.actor.name || notification.actor.username;
  switch (notification.type) {
    case "LIKE":
      return `${name} liked your post`;
    case "COMMENT":
      return `${name} commented on your post`;
    case "FOLLOW":
      return `${name} started following you`;
    case "FOLLOW_REQUEST":
      return `${name} requested to follow you`;
    default:
      return `${name} interacted with your content`;
  }
}

function getNotificationLink(notification: Notification): string {
  return `/profile/${notification.actor.username}`;
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w`;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Mark all as read on mount
  useEffect(() => {
    fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }).catch((err) => {
      console.error("Failed to mark notifications as read:", err);
    });
  }, []);

  const fetchNotifications = useCallback(
    async (reset = false) => {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const params = new URLSearchParams();
        params.set("limit", "20");
        if (!reset && cursor) params.set("cursor", cursor);

        const res = await fetch(`/api/notifications?${params.toString()}`);
        if (!res.ok) throw new Error(`API returned ${res.status}`);

        const data = await res.json();

        // Validate response structure
        if (!data || !Array.isArray(data.notifications)) {
          console.error("Invalid notifications response:", data);
          throw new Error("Invalid notification data structure");
        }

        if (reset) {
          setNotifications(data.notifications);
        } else {
          setNotifications((prev) => [...prev, ...data.notifications]);
        }
        setCursor(data.nextCursor);
        setHasMore(!!data.nextCursor);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [cursor]
  );

  useEffect(() => {
    fetchNotifications(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Infinite scroll
  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          fetchNotifications(false);
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, fetchNotifications]);

  return (
    <div className="max-w-lg mx-auto px-4 pt-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-foreground">Notifications</h1>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="bg-card rounded-xl border border-border h-16 animate-pulse"
            />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted text-sm">No notifications yet.</p>
          <p className="text-muted text-xs mt-1">
            When someone likes or comments on your posts, you&apos;ll see it
            here.
          </p>
        </div>
      ) : (
        <div className="space-y-1 pb-4">
          {notifications.map((notification) => {
            const Icon = ICON_MAP[notification.type];
            const iconColor = ICON_COLOR_MAP[notification.type];

            return (
              <Link
                key={notification.id}
                href={getNotificationLink(notification)}
                className={`flex items-start gap-3 p-3 rounded-xl transition-colors hover:bg-white/5 ${
                  !notification.read ? "bg-primary/5" : ""
                }`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {notification.actor.avatarUrl ? (
                    <img
                      src={notification.actor.avatarUrl}
                      alt={notification.actor.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <HiUserCircle className="h-10 w-10 text-gray-300" />
                  )}
                  <div
                    className={`absolute -bottom-1 -right-1 rounded-full bg-white p-0.5`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-snug">
                    <span className="font-semibold">
                      {notification.actor.username}
                    </span>{" "}
                    {getNotificationText(notification).split(
                      notification.actor.name || notification.actor.username
                    )[1]}
                  </p>
                  {notification.post?.caption && (
                    <p className="text-xs text-muted mt-0.5 truncate">
                      {notification.post.caption}
                    </p>
                  )}
                  <p className="text-xs text-muted mt-0.5">
                    {timeAgo(notification.createdAt)}
                  </p>
                </div>

                {/* Unread dot */}
                {!notification.read && (
                  <div className="flex-shrink-0 mt-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </div>
                )}
              </Link>
            );
          })}
          {loadingMore && (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <div ref={sentinelRef} className="h-1" />
        </div>
      )}
    </div>
  );
}
