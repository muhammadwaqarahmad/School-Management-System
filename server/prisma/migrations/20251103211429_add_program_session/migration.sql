-- CreateTable
CREATE TABLE "ProgramSession" (
    "id" SERIAL NOT NULL,
    "program" TEXT NOT NULL,
    "session" TEXT NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "startYear" INTEGER,
    "endYear" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgramSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProgramSession_program_isCurrent_idx" ON "ProgramSession"("program", "isCurrent");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramSession_program_session_key" ON "ProgramSession"("program", "session");
