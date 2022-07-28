/*
  Warnings:

  - A unique constraint covering the columns `[courseId,userId]` on the table `Tag` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Tag_courseId_userId_key" ON "Tag"("courseId", "userId");
