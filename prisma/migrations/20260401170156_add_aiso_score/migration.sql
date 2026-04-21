-- DropForeignKey
ALTER TABLE "AISOScore" DROP CONSTRAINT "AISOScore_pageId_fkey";

-- DropTable
DROP TABLE "AISOScore";

-- CreateTable
CREATE TABLE "AisoScore" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "totalScore" INTEGER NOT NULL,
    "scores" JSONB NOT NULL,
    "actionItems" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AisoScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AisoScore_pageId_key" ON "AisoScore"("pageId");

-- AddForeignKey
ALTER TABLE "AisoScore" ADD CONSTRAINT "AisoScore_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "IndexedPage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
