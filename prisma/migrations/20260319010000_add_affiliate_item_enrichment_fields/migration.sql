-- AlterTable: add nullable/default-safe enrichment fields to AffiliateItem
ALTER TABLE "AffiliateItem"
ADD COLUMN "subcategoryTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "ctaLabel" TEXT,
ADD COLUMN "logoUrl" TEXT,
ADD COLUMN "enrichmentConfidence" TEXT,
ADD COLUMN "needsReview" BOOLEAN NOT NULL DEFAULT false;
