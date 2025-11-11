-- Create ProgramSessionFee table to link fees with programs and sessions
-- This allows multiple fees for the same program with different sessions

-- First, let's modify ProgramFee to support sessions
-- We'll add sessionId to link to ProgramSession

ALTER TABLE "ProgramFee" 
ADD COLUMN IF NOT EXISTS "sessionId" INTEGER;

-- Add foreign key constraint if sessionId is added
-- ALTER TABLE "ProgramFee" 
-- ADD CONSTRAINT "ProgramFee_sessionId_fkey" 
-- FOREIGN KEY ("sessionId") REFERENCES "ProgramSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Remove unique constraint on program since we can have multiple fees for same program with different sessions
-- ALTER TABLE "ProgramFee" DROP CONSTRAINT IF EXISTS "ProgramFee_program_key";

-- Add unique constraint on (program, sessionId) if sessionId is not null
-- CREATE UNIQUE INDEX IF NOT EXISTS "ProgramFee_program_sessionId_key" ON "ProgramFee"("program", "sessionId") WHERE "sessionId" IS NOT NULL;

