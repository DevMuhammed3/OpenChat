/*
  Warnings:

  - You are about to drop the column `zoneId` on the `Chat` table. All the data in the column will be lost.
  - You are about to drop the `Zone` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ZoneMember` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ChannelType" AS ENUM ('TEXT', 'VOICE');

-- DropForeignKey
ALTER TABLE "Chat" DROP CONSTRAINT "Chat_zoneId_fkey";

-- DropForeignKey
ALTER TABLE "Zone" DROP CONSTRAINT "Zone_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "ZoneMember" DROP CONSTRAINT "ZoneMember_userId_fkey";

-- DropForeignKey
ALTER TABLE "ZoneMember" DROP CONSTRAINT "ZoneMember_zoneId_fkey";

-- AlterTable
ALTER TABLE "Chat" DROP COLUMN "zoneId";

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "channelId" INTEGER;

-- DropTable
DROP TABLE "Zone";

-- DropTable
DROP TABLE "ZoneMember";

-- CreateTable
CREATE TABLE "Channel" (
    "id" SERIAL NOT NULL,
    "publicId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ChannelType" NOT NULL DEFAULT 'TEXT',
    "chatId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Channel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Channel_publicId_key" ON "Channel"("publicId");

-- CreateIndex
CREATE INDEX "Channel_chatId_idx" ON "Channel"("chatId");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Channel" ADD CONSTRAINT "Channel_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
