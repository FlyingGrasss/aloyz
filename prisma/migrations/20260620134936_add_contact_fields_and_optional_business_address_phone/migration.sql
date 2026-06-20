-- AlterTable
ALTER TABLE "Business" ALTER COLUMN "phone" DROP NOT NULL,
ALTER COLUMN "address" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "customerName" TEXT,
ADD COLUMN     "customerPhone" TEXT,
ADD COLUMN     "instagramUsername" TEXT;
