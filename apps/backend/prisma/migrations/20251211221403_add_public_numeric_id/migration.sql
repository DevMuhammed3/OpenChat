/*
  Warnings:

  - A unique constraint covering the columns `[publicNumericId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "publicNumericId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_publicNumericId_key" ON "User"("publicNumericId");
