-- DropIndex
DROP INDEX "users_email_deletedAt_key";

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
