-- AlterTable
ALTER TABLE "Score" ADD COLUMN     "tagId" INTEGER;

-- AddForeignKey
ALTER TABLE "Score" ADD CONSTRAINT "Score_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE SET NULL ON UPDATE CASCADE;
