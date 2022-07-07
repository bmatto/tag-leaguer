/*
  Warnings:

  - A unique constraint covering the columns `[userId,eventId]` on the table `Score` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Score_userId_eventId_key" ON "Score"("userId", "eventId");
