-- AlterTable
ALTER TABLE "User" ADD COLUMN     "facebookId" TEXT,
ADD COLUMN     "status" BOOLEAN NOT NULL DEFAULT false;
