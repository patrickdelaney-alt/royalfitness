-- Migration: add_referral_loop
-- Adds ReferralLink, ReferralAttribution, REFERRAL_PURCHASE notification type,
-- nullable actorId on Notification, and body/referralLinkId fields.
-- All changes are additive — no existing data is altered or dropped.

-- ── ReferralLink ──────────────────────────────────────────────────────────────

CREATE TABLE "ReferralLink" (
    "id"         TEXT         NOT NULL,
    "userId"     TEXT         NOT NULL,
    "sourceType" TEXT         NOT NULL,
    "sourceId"   TEXT         NOT NULL,
    "clickCount" INTEGER      NOT NULL DEFAULT 0,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralLink_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ReferralLink_userId_idx"              ON "ReferralLink"("userId");
CREATE INDEX "ReferralLink_sourceType_sourceId_idx" ON "ReferralLink"("sourceType", "sourceId");

ALTER TABLE "ReferralLink"
    ADD CONSTRAINT "ReferralLink_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── ReferralAttribution ───────────────────────────────────────────────────────

CREATE TABLE "ReferralAttribution" (
    "id"             TEXT         NOT NULL,
    "referralLinkId" TEXT         NOT NULL,
    "newUserId"      TEXT         NOT NULL,
    "welcomeShown"   BOOLEAN      NOT NULL DEFAULT false,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralAttribution_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReferralAttribution_newUserId_key" ON "ReferralAttribution"("newUserId");

ALTER TABLE "ReferralAttribution"
    ADD CONSTRAINT "ReferralAttribution_referralLinkId_fkey"
    FOREIGN KEY ("referralLinkId") REFERENCES "ReferralLink"("id") ON UPDATE CASCADE;

ALTER TABLE "ReferralAttribution"
    ADD CONSTRAINT "ReferralAttribution_newUserId_fkey"
    FOREIGN KEY ("newUserId") REFERENCES "User"("id") ON UPDATE CASCADE;

-- ── NotificationType enum — add REFERRAL_PURCHASE ────────────────────────────

ALTER TYPE "NotificationType" ADD VALUE 'REFERRAL_PURCHASE';

-- ── Notification — new columns ────────────────────────────────────────────────

ALTER TABLE "Notification" ADD COLUMN "body"           TEXT;
ALTER TABLE "Notification" ADD COLUMN "referralLinkId" TEXT;

-- ── Notification — make actorId nullable ──────────────────────────────────────
-- Drop the old NOT NULL FK, re-add as nullable with SET NULL on actor deletion.

ALTER TABLE "Notification" ALTER COLUMN "actorId" DROP NOT NULL;

ALTER TABLE "Notification" DROP CONSTRAINT IF EXISTS "Notification_actorId_fkey";
ALTER TABLE "Notification"
    ADD CONSTRAINT "Notification_actorId_fkey"
    FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ── Notification — referralLink FK ───────────────────────────────────────────

ALTER TABLE "Notification"
    ADD CONSTRAINT "Notification_referralLinkId_fkey"
    FOREIGN KEY ("referralLinkId") REFERENCES "ReferralLink"("id") ON DELETE SET NULL ON UPDATE CASCADE;
