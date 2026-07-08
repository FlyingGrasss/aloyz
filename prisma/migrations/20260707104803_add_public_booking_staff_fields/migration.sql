-- AlterTable
ALTER TABLE "AppointmentTrack" ADD COLUMN     "serviceId" TEXT,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'manual',
ADD COLUMN     "staffId" TEXT;

-- CreateIndex
CREATE INDEX "AppointmentTrack_businessId_date_idx" ON "AppointmentTrack"("businessId", "date");

-- CreateIndex
CREATE INDEX "AppointmentTrack_businessId_staffId_date_idx" ON "AppointmentTrack"("businessId", "staffId", "date");
