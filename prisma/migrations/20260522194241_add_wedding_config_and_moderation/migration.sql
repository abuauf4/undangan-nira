-- CreateTable
CREATE TABLE "WeddingConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Wish" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "avatar" TEXT NOT NULL DEFAULT '',
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Wish" ("avatar", "createdAt", "id", "message", "name") SELECT "avatar", "createdAt", "id", "message", "name" FROM "Wish";
DROP TABLE "Wish";
ALTER TABLE "new_Wish" RENAME TO "Wish";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "WeddingConfig_key_key" ON "WeddingConfig"("key");
