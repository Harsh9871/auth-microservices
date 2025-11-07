-- CreateIndex
CREATE INDEX "User_app_id_createdAt_idx" ON "User"("app_id", "createdAt");

-- CreateIndex
CREATE INDEX "User_app_id_name_idx" ON "User"("app_id", "name");

-- CreateIndex
CREATE INDEX "User_app_id_email_idx" ON "User"("app_id", "email");
