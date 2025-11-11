import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Create Super Admin User
  const superAdminPassword = await bcrypt.hash('super123', 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@school.com' },
    update: {},
    create: {
      registrationNo: 'REG000000',
      name: 'Super Admin',
      fatherName: 'Super Admin Father',
      email: 'superadmin@school.com',
      password: superAdminPassword,
      role: 'SUPER_ADMIN',
      mobileNumber: '03000000000',
      permanentAddress: 'Main Office, School Management, Islamabad, Pakistan',
      currentAddress: 'Main Office, School Management, Islamabad, Pakistan'
    }
  });
  console.log('Super Admin created:', superAdmin.email);

  // Create Admin User
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@school.com' },
    update: {},
    create: {
      registrationNo: 'REG000001',
      name: 'Admin User',
      fatherName: 'Admin Father',
      email: 'admin@school.com',
      password: adminPassword,
      role: 'ADMIN',
      mobileNumber: '03001234567',
      permanentAddress: 'House #123, Street 45, Islamabad, Pakistan',
      currentAddress: 'House #123, Street 45, Islamabad, Pakistan'
    }
  });
  console.log('Admin created:', admin.email);

  // Create Accountant User
  const accountantPassword = await bcrypt.hash('accountant123', 10);
  const accountant = await prisma.user.upsert({
    where: { email: 'accountant@school.com' },
    update: {},
    create: {
      registrationNo: 'REG000002',
      name: 'Accountant User',
      fatherName: 'Accountant Father',
      email: 'accountant@school.com',
      password: accountantPassword,
      role: 'ACCOUNTANT',
      mobileNumber: '03009876543',
      permanentAddress: 'House #456, Street 78, Karachi, Pakistan',
      currentAddress: 'House #456, Street 78, Karachi, Pakistan'
    }
  });
  console.log('Accountant created:', accountant.email);

  // Create Sample Program Fees
  const programs = [
    { program: 'Computer Science', feeAmount: 50000 },
    { program: 'Business Administration', feeAmount: 45000 },
    { program: 'Engineering', feeAmount: 60000 },
    { program: 'Medicine', feeAmount: 100000 },
    { program: 'Arts', feeAmount: 30000 }
  ];

  for (const prog of programs) {
    const programFee = await prisma.programFee.upsert({
      where: { program: prog.program },
      update: {},
      create: prog
    });
    console.log('Program fee created:', programFee.program, '-', programFee.feeAmount);
  }

  // Create Sample Student
  const student1 = await prisma.student.upsert({
    where: { rollNo: 'CS-2024-001' },
    update: {},
    create: {
      registrationNo: 'STU2024001',
      name: 'Ahmed Ali',
      fatherName: 'Ali Khan',
      rollNo: 'CS-2024-001',
      program: 'Computer Science',
      session: '2024-2025',
      class: '1st Year',
      section: 'A',
      phoneNumber: '03111234567',
      email: 'ahmed@example.com',
      currentAddress: 'House #10, Block A, Lahore',
      permanentAddress: 'House #10, Block A, Lahore'
    }
  });
  console.log('Sample student created:', student1.name);

  // Create Sample Employee
  const employee1 = await prisma.employee.upsert({
    where: { registrationNo: 'EMP2024001' },
    update: {},
    create: {
      registrationNo: 'EMP2024001',
      name: 'Dr. Sarah Ahmed',
      fatherName: 'Ahmed Hassan',
      position: 'Professor',
      phoneNumber: '03221234567',
      joiningDate: new Date('2024-01-15'),
      salary: 80000,
      emailAddress: 'sarah@school.com',
      currentAddress: 'Apartment 5B, DHA Phase 5, Karachi',
      permanentAddress: 'Apartment 5B, DHA Phase 5, Karachi'
    }
  });
  console.log('Sample employee created:', employee1.name);

  console.log('\nDatabase seeding completed successfully!');
  console.log('\nLogin Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Super Admin:');
  console.log('   Email: superadmin@school.com');
  console.log('   Password: super123');
  console.log('\nAdmin:');
  console.log('   Email: admin@school.com');
  console.log('   Password: admin123');
  console.log('\nAccountant:');
  console.log('   Email: accountant@school.com');
  console.log('   Password: accountant123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

