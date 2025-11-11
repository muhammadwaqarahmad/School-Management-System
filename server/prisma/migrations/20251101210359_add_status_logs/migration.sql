-- CreateTable
CREATE TABLE "StudentStatusLog" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "oldStatus" "StudentStatus" NOT NULL,
    "newStatus" "StudentStatus" NOT NULL,
    "description" TEXT,
    "changedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentStatusLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeStatusLog" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "oldStatus" "EmployeeStatus" NOT NULL,
    "newStatus" "EmployeeStatus" NOT NULL,
    "description" TEXT,
    "changedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeStatusLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "StudentStatusLog" ADD CONSTRAINT "StudentStatusLog_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeStatusLog" ADD CONSTRAINT "EmployeeStatusLog_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
