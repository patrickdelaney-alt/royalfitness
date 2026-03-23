-- Add CATALOG_SHARE to PostType enum
ALTER TYPE "PostType" ADD VALUE IF NOT EXISTS 'CATALOG_SHARE';

-- Create CatalogItemType enum
DO $$ BEGIN
  CREATE TYPE "CatalogItemType" AS ENUM ('MEAL', 'WORKOUT', 'SUPPLEMENT', 'ACCESSORY', 'WELLNESS', 'AFFILIATE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CreateTable: CatalogShareDetail (immutable snapshot of catalog item at share time)
CREATE TABLE IF NOT EXISTS "CatalogShareDetail" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "catalogItemId" TEXT NOT NULL,
    "catalogItemType" "CatalogItemType" NOT NULL,
    "title" TEXT NOT NULL,
    "brand" TEXT,
    "description" TEXT,
    "photoUrl" TEXT,
    "link" TEXT,
    "referralCode" TEXT,
    "category" TEXT,
    "ctaLabel" TEXT,

    CONSTRAINT "CatalogShareDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CatalogShareCooldown (anti-spam guard)
CREATE TABLE IF NOT EXISTS "CatalogShareCooldown" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "catalogItemId" TEXT NOT NULL,
    "catalogItemType" "CatalogItemType" NOT NULL,
    "sharedDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CatalogShareCooldown_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: unique constraint on CatalogShareDetail.postId
CREATE UNIQUE INDEX IF NOT EXISTS "CatalogShareDetail_postId_key" ON "CatalogShareDetail"("postId");

-- CreateIndex: lookup index for CatalogShareDetail
CREATE INDEX IF NOT EXISTS "CatalogShareDetail_catalogItemId_catalogItemType_idx"
    ON "CatalogShareDetail"("catalogItemId", "catalogItemType");

-- CreateIndex: unique constraint on CatalogShareCooldown (anti-spam, one share per item per user per day)
CREATE UNIQUE INDEX IF NOT EXISTS "CatalogShareCooldown_userId_catalogItemId_catalogItemType_sharedDate_key"
    ON "CatalogShareCooldown"("userId", "catalogItemId", "catalogItemType", "sharedDate");

-- CreateIndex: lookup index for CatalogShareCooldown
CREATE INDEX IF NOT EXISTS "CatalogShareCooldown_userId_sharedDate_idx"
    ON "CatalogShareCooldown"("userId", "sharedDate");

-- AddForeignKey: CatalogShareDetail -> Post
ALTER TABLE "CatalogShareDetail"
    ADD CONSTRAINT "CatalogShareDetail_postId_fkey"
    FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
