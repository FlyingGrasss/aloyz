/*
  Warnings:

  - You are about to drop the column `logo_url` on the `Business` table. All the data in the column will be lost.
  - You are about to drop the column `primary_color` on the `Business` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[instagram_page_id]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - The required column `id` was added to the `VerificationToken` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "Business" DROP COLUMN "logo_url",
DROP COLUMN "primary_color",
ALTER COLUMN "calendarId" SET DEFAULT '',
ALTER COLUMN "welcome_message" DROP NOT NULL,
ALTER COLUMN "is_active" SET DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "instagram_access_token" TEXT,
ADD COLUMN     "instagram_page_id" TEXT;

-- AlterTable
ALTER TABLE "VerificationToken" ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "User_instagram_page_id_key" ON "User"("instagram_page_id");
