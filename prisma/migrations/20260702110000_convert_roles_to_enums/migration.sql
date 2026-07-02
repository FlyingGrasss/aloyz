CREATE TYPE "UserRole" AS ENUM ('admin', 'business');
CREATE TYPE "BusinessMemberRole" AS ENUM ('owner', 'employee');

ALTER TABLE "User"
  ALTER COLUMN "role" DROP DEFAULT,
  ALTER COLUMN "role" TYPE "UserRole" USING "role"::"UserRole",
  ALTER COLUMN "role" SET DEFAULT 'business';

ALTER TABLE "BusinessMembership"
  ALTER COLUMN "role" DROP DEFAULT,
  ALTER COLUMN "role" TYPE "BusinessMemberRole" USING "role"::"BusinessMemberRole",
  ALTER COLUMN "role" SET DEFAULT 'employee';

ALTER TABLE "BusinessInvite"
  ALTER COLUMN "role" DROP DEFAULT,
  ALTER COLUMN "role" TYPE "BusinessMemberRole" USING "role"::"BusinessMemberRole",
  ALTER COLUMN "role" SET DEFAULT 'employee';
