/*
  Warnings:

  - A unique constraint covering the columns `[businessId,customerJid,channel]` on the table `Conversation` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Conversation_businessId_customerJid_key";

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "channel" TEXT NOT NULL DEFAULT 'whatsapp';

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_businessId_customerJid_channel_key" ON "Conversation"("businessId", "customerJid", "channel");
