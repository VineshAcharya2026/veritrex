-- Inner Circle (member reflection) admin review
ALTER TABLE "MemberReflection" ADD COLUMN "reviewStatus" TEXT;
ALTER TABLE "MemberReflection" ADD COLUMN "submittedAt" TEXT;
ALTER TABLE "MemberReflection" ADD COLUMN "reviewedAt" TEXT;
