/*
  Warnings:

  - You are about to drop the column `sessionId` on the `ProgramFee` table. All the data in the column will be lost.

*/
-- AlterTable: Add historical fields to Fee table (using IF NOT EXISTS to handle re-runs)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'Fee' AND column_name = 'historicalClass'
    ) THEN
        ALTER TABLE "Fee" ADD COLUMN "historicalClass" TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'Fee' AND column_name = 'historicalProgram'
    ) THEN
        ALTER TABLE "Fee" ADD COLUMN "historicalProgram" TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'Fee' AND column_name = 'historicalSection'
    ) THEN
        ALTER TABLE "Fee" ADD COLUMN "historicalSection" TEXT;
    END IF;
END $$;

-- AlterTable: Drop sessionId only if it exists (handles case where column was never created)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'ProgramFee' 
        AND column_name = 'sessionId'
    ) THEN
        ALTER TABLE "ProgramFee" DROP COLUMN "sessionId";
    END IF;
END $$;

-- CreateTable: Program (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'Program'
    ) THEN
        CREATE TABLE "Program" (
            "id" SERIAL NOT NULL,
            "name" TEXT NOT NULL,
            "description" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,

            CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
        );
    END IF;
END $$;

-- CreateTable: ProgramSessionFee (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'ProgramSessionFee'
    ) THEN
        CREATE TABLE "ProgramSessionFee" (
            "id" SERIAL NOT NULL,
            "programId" INTEGER NOT NULL,
            "sessionId" INTEGER NOT NULL,
            "feeAmount" DOUBLE PRECISION NOT NULL,
            "isActive" BOOLEAN NOT NULL DEFAULT true,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,

            CONSTRAINT "ProgramSessionFee_pkey" PRIMARY KEY ("id")
        );
    END IF;
END $$;

-- CreateIndex: Program name unique index (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'Program' 
        AND indexname = 'Program_name_key'
    ) THEN
        CREATE UNIQUE INDEX "Program_name_key" ON "Program"("name");
    END IF;
END $$;

-- CreateIndex: ProgramSessionFee indexes (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'ProgramSessionFee' 
        AND indexname = 'ProgramSessionFee_programId_isActive_idx'
    ) THEN
        CREATE INDEX "ProgramSessionFee_programId_isActive_idx" ON "ProgramSessionFee"("programId", "isActive");
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'ProgramSessionFee' 
        AND indexname = 'ProgramSessionFee_sessionId_isActive_idx'
    ) THEN
        CREATE INDEX "ProgramSessionFee_sessionId_isActive_idx" ON "ProgramSessionFee"("sessionId", "isActive");
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'ProgramSessionFee' 
        AND indexname = 'ProgramSessionFee_programId_sessionId_key'
    ) THEN
        CREATE UNIQUE INDEX "ProgramSessionFee_programId_sessionId_key" ON "ProgramSessionFee"("programId", "sessionId");
    END IF;
END $$;
