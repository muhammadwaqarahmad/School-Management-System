-- AlterTable
ALTER TABLE "Salary" ADD COLUMN     "paidBy" INTEGER,
ADD COLUMN     "paidDate" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "Salary" ADD CONSTRAINT "Salary_paidBy_fkey" FOREIGN KEY ("paidBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
