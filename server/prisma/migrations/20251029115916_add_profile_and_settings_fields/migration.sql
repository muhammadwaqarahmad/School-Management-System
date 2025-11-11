/*
  Warnings:

  - A unique constraint covering the columns `[registrationNo]` on the table `Employee` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[registrationNo]` on the table `Student` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[registrationNo]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `currentAddress` to the `Employee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `emailAddress` to the `Employee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fatherName` to the `Employee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `joiningDate` to the `Employee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `permanentAddress` to the `Employee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phoneNumber` to the `Employee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `registrationNo` to the `Employee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `salary` to the `Employee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `currentAddress` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fatherName` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `permanentAddress` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phoneNumber` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `program` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `registrationNo` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `session` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `currentAddress` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fatherName` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mobileNumber` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `permanentAddress` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `registrationNo` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "currentAddress" TEXT NOT NULL,
ADD COLUMN     "emailAddress" TEXT NOT NULL,
ADD COLUMN     "fatherName" TEXT NOT NULL,
ADD COLUMN     "joiningDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "permanentAddress" TEXT NOT NULL,
ADD COLUMN     "phoneNumber" TEXT NOT NULL,
ADD COLUMN     "registrationNo" TEXT NOT NULL,
ADD COLUMN     "salary" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "currentAddress" TEXT NOT NULL,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "fatherName" TEXT NOT NULL,
ADD COLUMN     "permanentAddress" TEXT NOT NULL,
ADD COLUMN     "phoneNumber" TEXT NOT NULL,
ADD COLUMN     "program" TEXT NOT NULL,
ADD COLUMN     "registrationNo" TEXT NOT NULL,
ADD COLUMN     "session" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "currentAddress" TEXT NOT NULL,
ADD COLUMN     "fatherName" TEXT NOT NULL,
ADD COLUMN     "mobileNumber" TEXT NOT NULL,
ADD COLUMN     "permanentAddress" TEXT NOT NULL,
ADD COLUMN     "registrationNo" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "ProgramFee" (
    "id" SERIAL NOT NULL,
    "program" TEXT NOT NULL,
    "feeAmount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgramFee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProgramFee_program_key" ON "ProgramFee"("program");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_registrationNo_key" ON "Employee"("registrationNo");

-- CreateIndex
CREATE UNIQUE INDEX "Student_registrationNo_key" ON "Student"("registrationNo");

-- CreateIndex
CREATE UNIQUE INDEX "User_registrationNo_key" ON "User"("registrationNo");
