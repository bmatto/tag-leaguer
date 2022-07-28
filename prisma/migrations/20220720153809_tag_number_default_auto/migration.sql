-- AlterTable
CREATE SEQUENCE "tag_number_seq";
ALTER TABLE "Tag" ALTER COLUMN "number" SET DEFAULT nextval('tag_number_seq');
ALTER SEQUENCE "tag_number_seq" OWNED BY "Tag"."number";
