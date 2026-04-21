-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."ChunkType" AS ENUM ('HEADING', 'PARAGRAPH', 'META', 'ALT_TEXT');

-- CreateEnum
CREATE TYPE "public"."EditField" AS ENUM ('META_TITLE', 'META_DESCRIPTION', 'BODY_COPY');

-- CreateEnum
CREATE TYPE "public"."EditStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."IndexStatus" AS ENUM ('PENDING', 'INDEXING', 'COMPLETE', 'ERROR');

-- Add vector extension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateTable
CREATE TABLE "public"."IndexedPage" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "contentHash" TEXT NOT NULL,
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "h1Count" INTEGER NOT NULL DEFAULT 0,
    "missingAltCount" INTEGER NOT NULL DEFAULT 0,
    "indexStatus" "public"."IndexStatus" NOT NULL DEFAULT 'PENDING',
    "lastIndexedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndexedPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Site" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);
