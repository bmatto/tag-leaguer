/*
  Warnings:

  - A unique constraint covering the columns `[number,courseId]` on the table `Tag` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Tag_number_courseId_key" ON "Tag"("number", "courseId");
