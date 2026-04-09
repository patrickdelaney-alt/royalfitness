"use client";

import { useState } from "react";
import { generateShareCard, type ShareCardData } from "@/lib/generate-share-card";

interface ShareCardButtonProps {
  data: ShareCardData;
  className?: string;
}

export default function ShareCardButton({ data, className }: ShareCardButtonProps) {
  const [generating, setGenerating] = useState(false);

  async function handleClick() {
    if (generating) return;
    setGenerating(true);
    try {
      const blob = await generateShareCard(data);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "royal-share.png";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Share card generation failed:", err);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={generating}
      className={className}
    >
      {generating ? "Generating..." : "Save card"}
    </button>
  );
}
