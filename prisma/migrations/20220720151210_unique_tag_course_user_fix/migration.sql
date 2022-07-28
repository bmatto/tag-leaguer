/*
  Warnings:

  - A unique constraint covering the columns `[number]` on the table `Tag` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Tag_courseId_userId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Tag_number_key" ON "Tag"("number");
