"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { HiArrowLeft, HiCamera } from "react-icons/hi";
import { compressImage } from "@/lib/compress-image";

export default function EditProfilePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [instagramUrl, setInstagramUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [notifyOnLike, setNotifyOnLike] = useState(true);
  const [notifyOnComment, setNotifyOnComment] = useState(true);
  const [notifyOnFollow, setNotifyOnFollow] = useState(true);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  const username = (session?.user as { username?: string })?.username ?? "";

  useEffect(() => {
    if (!username) return;
    fetch(`/api/users/${encodeURIComponent(username)}`)
      .then((r) => r.json())
      .then((data) => {
        const u = data.user;
        setName(u.name ?? "");
        setBio(u.bio ?? "");
        setAvatarUrl(u.avatarUrl ?? "");
        setIsPrivate(u.isPrivate ?? false);
        setInstagramUrl(u.instagramUrl ?? "");
        setTiktokUrl(u.tiktokUrl ?? "");
        setNotifyOnLike(u.notifyOnLike ?? true);
        setNotifyOnComment(u.notifyOnComment ?? true);
        setNotifyOnFollow(u.notifyOnFollow ?? true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [username]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarPreview(URL.createObjectURL(file));
    setUploading(true);
    setError("");

    try {
      const fileToUpload = await compressImage(file, 800, 0.85);
      const formData = new FormData();
      formData.append("file", fileToUpload);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Upload failed");
        setAvatarPreview(null);
        return;
      }
      const { url } = await res.json();
      setAvatarUrl(url);
    } catch {
      setError("Upload failed");
      setAvatarPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setError("");
    setSuccess(false);
    setSaving(true);

    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          bio: bio.trim(),
          avatarUrl: avatarUrl || "",
          isPrivate,
          instagramUrl: instagramUrl.trim(),
          tiktokUrl: tiktokUrl.trim(),
          notifyOnLike,
          notifyOnComment,
          notifyOnFollow,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Failed to save");
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push(`/profile/${username}`), 800);
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "DELETE") return;
    setDeleting(true);
    try {
      const res = await fetch("/api/users/me", { method: "DELETE" });
      if (!res.ok) {
        setError("Failed to delete account");
        return;
      }
      await signOut({ callbackUrl: "/signin" });
    } catch {
      setError("Something went wrong");
    } finally {
      setDeleting(false);
    }
  };

  const inputClass =
    "w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

  const displayAvatar = avatarPreview || avatarUrl;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-muted hover:text-foreground">
          <HiArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Edit Profile</h1>
      </div>

      {/* Avatar */}
      <div className="flex justify-center mb-6">
        <div className="relative">
          {displayAvatar ? (
            <img
              src={displayAvatar}
              alt="Avatar"
              className="w-24 h-24 rounded-full object-cover border-2 border-border"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold border-2 border-border">
              {name?.[0]?.toUpperCase() ?? username?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-1.5 border-2 border-white hover:bg-primary-dark transition-colors"
          >
            <HiCamera className="w-4 h-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,image/heic,image/heif"
            style={{ position: "absolute", opacity: 0, width: 0, height: 0, pointerEvents: "none" }}
            onChange={handleAvatarChange}
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
      )}
      {success && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-700 text-sm">
          Profile saved!
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Display Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Tell people about yourself..."
            className={inputClass + " resize-none"}
          />
          <p className="text-xs text-muted mt-1 text-right">{bio.length}/500</p>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-background">
          <div>
            <p className="text-sm font-medium text-foreground">Private Account</p>
            <p className="text-xs text-muted">Only approved followers can see your posts</p>
          </div>
          <button
            type="button"
            onClick={() => setIsPrivate((v) => !v)}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              isPrivate ? "bg-primary" : "bg-gray-200"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                isPrivate ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Instagram URL
          </label>
          <input
            value={instagramUrl}
            onChange={(e) => setInstagramUrl(e.target.value)}
            placeholder="https://instagram.com/yourhandle"
            type="url"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">TikTok URL</label>
          <input
            value={tiktokUrl}
            onChange={(e) => setTiktokUrl(e.target.value)}
            placeholder="https://tiktok.com/@yourhandle"
            type="url"
            className={inputClass}
          />
        </div>

        {/* Notification Preferences */}
        <div className="space-y-2 pt-2">
          <p className="text-sm font-semibold text-foreground">Notification Preferences</p>
          <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
            Choose what activity sends you a notification.
          </p>
          {[
            { label: "Likes on my posts", key: "like" as const, value: notifyOnLike, setter: setNotifyOnLike },
            { label: "Comments on my posts", key: "comment" as const, value: notifyOnComment, setter: setNotifyOnComment },
            { label: "New followers", key: "follow" as const, value: notifyOnFollow, setter: setNotifyOnFollow },
          ].map(({ label, value, setter }) => (
            <div
              key={label}
              className="flex items-center justify-between p-3 rounded-lg border border-border bg-background"
            >
              <p className="text-sm text-foreground">{label}</p>
              <button
                type="button"
                onClick={() => setter((v) => !v)}
                className={`relative w-11 h-6 rounded-full transition-colors ${value ? "bg-primary" : "bg-gray-200"}`}
                aria-pressed={value}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    value ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={saving || uploading}
          className="w-full py-3 rounded-lg bg-primary hover:bg-primary-dark text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>

        <div className="pt-4 text-center">
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="text-xs text-muted hover:text-red-500 underline transition-colors"
          >
            Delete Account
          </button>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-xl bg-background border border-border p-6 space-y-4">
            <h2 className="text-base font-bold text-foreground">Delete Account</h2>
            <p className="text-sm text-muted">
              This will permanently delete your account and all your data. This action cannot be undone.
            </p>
            <p className="text-sm text-foreground">
              Type <strong>DELETE</strong> to confirm:
            </p>
            <input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="DELETE"
              className={inputClass}
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setShowDeleteModal(false); setDeleteConfirm(""); }}
                className="flex-1 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-gray-100/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== "DELETE" || deleting}
                className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {deleting ? "Deleting..." : "Delete Forever"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
