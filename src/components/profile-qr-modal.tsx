"use client";

import { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { HiX, HiDownload } from "react-icons/hi";

interface ProfileQRModalProps {
  username: string;
  name: string | null;
  avatarUrl: string | null;
  onClose: () => void;
}

export default function ProfileQRModal({
  username,
  name,
  avatarUrl,
  onClose,
}: ProfileQRModalProps) {
  const [profileUrl, setProfileUrl] = useState("");
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setProfileUrl(`${window.location.origin}/profile/${username}`);
  }, [username]);

  // Close on Escape key
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleDownload = () => {
    if (!qrRef.current) return;
    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      }
      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `${username}-qr-code.png`;
      link.href = pngUrl;
      link.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  if (!profileUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-card rounded-2xl shadow-xl max-w-sm w-full p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full text-muted hover:text-foreground hover:bg-gray-100 transition-colors"
        >
          <HiX className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <h2 className="text-lg font-bold text-foreground">Share Profile</h2>
          <p className="text-sm text-muted mt-1">
            Scan this QR code to view{" "}
            <span className="font-medium text-foreground">@{username}</span>
            &apos;s profile
          </p>
        </div>

        {/* QR Code */}
        <div
          ref={qrRef}
          className="flex justify-center p-6 bg-white rounded-xl border border-border"
        >
          <QRCodeSVG
            value={profileUrl}
            size={200}
            level="M"
            bgColor="#ffffff"
            fgColor="#1a1a1a"
          />
        </div>

        {/* User info */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={username}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
              {name
                ? name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                : "?"}
            </div>
          )}
          <span className="text-sm font-semibold text-foreground">
            @{username}
          </span>
        </div>

        {/* URL display */}
        <p className="text-xs text-muted text-center mt-2 break-all">
          {profileUrl}
        </p>

        {/* Download button */}
        <button
          onClick={handleDownload}
          className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:border-gray-400 transition-colors"
        >
          <HiDownload className="w-4 h-4" />
          Download QR Code
        </button>
      </div>
    </div>
  );
}
