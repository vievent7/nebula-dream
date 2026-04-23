/*
  Warnings:

  - Added the required column `displayName` to the `SignupVerificationToken` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN "name" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SignupVerificationToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "displayName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_SignupVerificationToken" ("createdAt", "email", "expiresAt", "id", "passwordHash", "tokenHash", "usedAt") SELECT "createdAt", "email", "expiresAt", "id", "passwordHash", "tokenHash", "usedAt" FROM "SignupVerificationToken";
DROP TABLE "SignupVerificationToken";
ALTER TABLE "new_SignupVerificationToken" RENAME TO "SignupVerificationToken";
CREATE UNIQUE INDEX "SignupVerificationToken_tokenHash_key" ON "SignupVerificationToken"("tokenHash");
CREATE INDEX "SignupVerificationToken_email_expiresAt_idx" ON "SignupVerificationToken"("email", "expiresAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
