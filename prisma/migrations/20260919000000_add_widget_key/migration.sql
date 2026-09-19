-- AlterTable
ALTER TABLE "users" ADD COLUMN "widgetKey" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_widgetKey_key" ON "users"("widgetKey");
