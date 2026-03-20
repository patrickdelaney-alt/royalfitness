-- AddColumn: subcategoryTags
ALTER TABLE "AffiliateItem" ADD COLUMN "subcategoryTags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- AddColumn: ctaLabel
ALTER TABLE "AffiliateItem" ADD COLUMN "ctaLabel" TEXT;

-- AddColumn: logoUrl
ALTER TABLE "AffiliateItem" ADD COLUMN "logoUrl" TEXT;

-- AddColumn: enrichmentConfidence
ALTER TABLE "AffiliateItem" ADD COLUMN "enrichmentConfidence" TEXT;

-- AddColumn: needsReview
ALTER TABLE "AffiliateItem" ADD COLUMN "needsReview" BOOLEAN NOT NULL DEFAULT false;
