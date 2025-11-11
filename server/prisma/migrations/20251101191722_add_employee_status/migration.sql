-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'RESIGNED', 'TERMINATED', 'RETIRED');

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE';
