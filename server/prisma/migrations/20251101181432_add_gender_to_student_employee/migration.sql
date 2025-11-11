-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "gender" "Gender";

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "gender" "Gender";
