/*
  Warnings:

  - You are about to drop the column `instagram_access_token` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `instagram_page_id` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[instagram_page_id]` on the table `Business` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "User_instagram_page_id_key";

-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "instagram_access_token" TEXT,
ADD COLUMN     "instagram_page_id" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "instagram_access_token",
DROP COLUMN "instagram_page_id";

-- CreateIndex
CREATE UNIQUE INDEX "Business_instagram_page_id_key" ON "Business"("instagram_page_id");
