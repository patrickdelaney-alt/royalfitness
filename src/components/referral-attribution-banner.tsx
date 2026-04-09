"use client";

import { useEffect, useState } from "react";

interface Attribution {
  referringHandle: string;
}

// Shown once on first open after signing up via a referral link.
// Quiet, one line, no border, no icon — "Earned Silence" principle.
// Auto-dismisses after 4 seconds or on click.
export default function ReferralAttributionBanner() {
  const [attribution, setAttribution] = useState<Attribution | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetch("/api/referral-attribution")
      .then((r) => r.json())
      .then((data: { attribution: Attribution | null }) => {
        if (data.attribution) {
          setAttribution(data.attribution);
          setVisible(true);
          const t = setTimeout(() => setVisible(false), 4000);
          return () => clearTimeout(t);
        }
      })
      .catch(() => {});
  }, []);

  if (!visible || !attribution) return null;

  return (
    <p
      onClick={() => setVisible(false)}
      className="text-sm text-primary/70 py-2 px-1 cursor-default select-none"
      style={{ fontFamily: "var(--font-body)" }}
    >
      You found Royal through{" "}
      <span className="text-primary font-medium">
        @{attribution.referringHandle}
      </span>
      .
    </p>
  );
}
