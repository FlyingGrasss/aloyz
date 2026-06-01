ALTER TABLE "sent_emails"
ADD COLUMN "senderName" TEXT NOT NULL DEFAULT 'Aloyz',
ADD COLUMN "bodyHtml" TEXT,
ADD COLUMN "contentMode" TEXT NOT NULL DEFAULT 'text';
