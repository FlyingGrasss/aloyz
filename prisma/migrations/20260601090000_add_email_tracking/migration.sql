CREATE TYPE "EmailType" AS ENUM ('CUSTOM');

CREATE TABLE "sent_emails" (
  "id" TEXT NOT NULL,
  "resendId" TEXT,
  "sentFrom" TEXT NOT NULL,
  "sentTo" TEXT NOT NULL,
  "subject" TEXT,
  "body" TEXT,
  "successful" BOOLEAN NOT NULL DEFAULT false,
  "type" "EmailType" NOT NULL DEFAULT 'CUSTOM',
  "errorMessage" TEXT,
  "userId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "sent_emails_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "received_emails" (
  "id" TEXT NOT NULL,
  "emailId" TEXT NOT NULL,
  "from" TEXT NOT NULL,
  "to" TEXT[],
  "subject" TEXT NOT NULL,
  "body" TEXT,
  "bodyHtml" TEXT,
  "attachments" JSONB,
  "messageId" TEXT,
  "rawEvent" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "received_emails_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "sent_emails_resendId_key" ON "sent_emails"("resendId");
CREATE INDEX "sent_emails_sentTo_idx" ON "sent_emails"("sentTo");
CREATE INDEX "sent_emails_type_idx" ON "sent_emails"("type");
CREATE INDEX "sent_emails_createdAt_idx" ON "sent_emails"("createdAt");

CREATE UNIQUE INDEX "received_emails_emailId_key" ON "received_emails"("emailId");
CREATE INDEX "received_emails_createdAt_idx" ON "received_emails"("createdAt");

ALTER TABLE "sent_emails" ADD CONSTRAINT "sent_emails_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
