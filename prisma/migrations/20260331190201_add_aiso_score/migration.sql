/*
  Warnings:

  - A unique constraint covering the columns `[siteId,url]` on the table `IndexedPage` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[url]` on the table `Site` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `Site` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "ContentChunk" (
    "id" TEXT NOT NULL,
    "indexedPageId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "contentType" "ChunkType" NOT NULL,
    "embedding" vector(1536),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatSession" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "messages" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposedEdit" (
    "id" TEXT NOT NULL,
    "indexedPageId" TEXT NOT NULL,
    "fieldName" "EditField" NOT NULL,
    "originalValue" TEXT NOT NULL,
    "proposedValue" TEXT NOT NULL,
    "status" "EditStatus" NOT NULL DEFAULT 'PENDING',
    "appliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProposedEdit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AISOScore" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "totalScore" INTEGER NOT NULL,
    "scores" JSONB[],
    "actionItems" JSONB[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AISOScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AISOScore_pageId_key" ON "AISOScore"("pageId");

-- CreateIndex
CREATE UNIQUE INDEX "IndexedPage_siteId_url_key" ON "IndexedPage"("siteId", "url");

-- CreateIndex
CREATE UNIQUE INDEX "Site_url_key" ON "Site"("url");

-- CreateIndex
CREATE UNIQUE INDEX "Site_slug_key" ON "Site"("slug");

-- AddForeignKey
ALTER TABLE "IndexedPage" ADD CONSTRAINT "IndexedPage_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentChunk" ADD CONSTRAINT "ContentChunk_indexedPageId_fkey" FOREIGN KEY ("indexedPageId") REFERENCES "IndexedPage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatSession" ADD CONSTRAINT "ChatSession_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposedEdit" ADD CONSTRAINT "ProposedEdit_indexedPageId_fkey" FOREIGN KEY ("indexedPageId") REFERENCES "IndexedPage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AISOScore" ADD CONSTRAINT "AISOScore_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "IndexedPage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
