-- CreateTable
CREATE TABLE "SignupVerificationToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "SignupVerificationToken_tokenHash_key" ON "SignupVerificationToken"("tokenHash");

-- CreateIndex
CREATE INDEX "SignupVerificationToken_email_expiresAt_idx" ON "SignupVerificationToken"("email", "expiresAt");
