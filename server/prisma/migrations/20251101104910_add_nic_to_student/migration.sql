/*
  Warnings:

  - A unique constraint covering the columns `[nic]` on the table `Student` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "nic" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Student_nic_key" ON "Student"("nic");
