-- CreateEnum: AffiliateCategory
CREATE TYPE "AffiliateCategory" AS ENUM ('SUPPLEMENTS', 'WELLNESS_ACCESSORIES', 'GYM_ACCESSORIES', 'RECOVERY_TOOLS', 'APPAREL', 'NUTRITION', 'TECH_WEARABLES', 'OTHER');

-- AlterEnum: add AFFILIATE value to PostType
ALTER TYPE "PostType" ADD VALUE IF NOT EXISTS 'AFFILIATE';

-- CreateTable: AffiliateItem (catalog)
CREATE TABLE "AffiliateItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "description" TEXT,
    "link" TEXT,
    "referralCode" TEXT,
    "category" "AffiliateCategory" NOT NULL DEFAULT 'OTHER',
    "photoUrl" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AffiliateItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable: AffiliateDetail (post detail)
CREATE TABLE "AffiliateDetail" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "affiliateItemId" TEXT,
    "title" TEXT NOT NULL,
    "brand" TEXT,
    "link" TEXT,
    "referralCode" TEXT,
    "category" "AffiliateCategory" NOT NULL DEFAULT 'OTHER',

    CONSTRAINT "AffiliateDetail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateDetail_postId_key" ON "AffiliateDetail"("postId");

-- AddForeignKey
ALTER TABLE "AffiliateItem" ADD CONSTRAINT "AffiliateItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateDetail" ADD CONSTRAINT "AffiliateDetail_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
