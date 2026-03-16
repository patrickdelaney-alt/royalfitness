-- AlterEnum: add CHECKIN value to PostType
ALTER TYPE "PostType" ADD VALUE IF NOT EXISTS 'CHECKIN';
