-- Migration: founding_member_system
-- Adds foundingMember + foundingMemberSeen flags to User,
-- and creates the FoundingMemberInvite table for invite tracking.

ALTER TABLE "User" ADD COLUMN "foundingMember" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "foundingMemberSeen" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "FoundingMemberInvite" (
    "id" TEXT NOT NULL,
    "inviterId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "signupCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoundingMemberInvite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FoundingMemberInvite_token_key" ON "FoundingMemberInvite"("token");
CREATE INDEX "FoundingMemberInvite_inviterId_idx" ON "FoundingMemberInvite"("inviterId");

ALTER TABLE "FoundingMemberInvite" ADD CONSTRAINT "FoundingMemberInvite_inviterId_fkey"
    FOREIGN KEY ("inviterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
