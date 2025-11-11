# 🎓 Profile & Settings Implementation Guide
## School Management System - Complete User & Program Management

---

## 📋 **What's Being Implemented:**

### 1. **User Profiles** (Admin & Accountant)
- Registration Number
- Name
- Father Name
- Mobile Number  
- Permanent Address
- Current Address

### 2. **Student Profiles** (Admin adds, Accountant views)
- Registration Number
- Name
- Father Name
- Program
- Session
- Fee (auto-fetched from program)
- Phone Number
- Email Address (optional)
- Current Address
- Permanent Address

### 3. **Employee Profiles** (Admin only)
- Registration Number
- Name
- Father Name
- Phone Number
- Joining Date
- Salary
- Email Address
- Current Address
- Permanent Address

### 4. **Settings Page** (Admin only)
- Program Fee Management
- Set fees for different programs
- Auto-fetch fee when adding students

---

## 🗄️ **Database Schema Updates:**

### **Updated Models:**

```prisma
model User {
  id                Int      @id @default(autoincrement())
  registrationNo    String   @unique
  name              String
  fatherName        String
  email             String   @unique
  password          String
  role              Role
  mobileNumber      String
  permanentAddress  String
  currentAddress    String
  createdAt         DateTime @default(now())
}

model Student {
  id                Int      @id @default(autoincrement())
  registrationNo    String   @unique
  name              String
  fatherName        String
  rollNo            String   @unique
  program           String
  session           String
  class             String
  section           String?
  phoneNumber       String
  email             String?  // Optional
  currentAddress    String
  permanentAddress  String
  fees              Fee[]
  createdAt         DateTime @default(now())
}

model Employee {
  id                Int      @id @default(autoincrement())
  registrationNo    String   @unique
  name              String
  fatherName        String
  position          String
  phoneNumber       String
  joiningDate       DateTime
  salary            Float
  emailAddress      String
  currentAddress    String
  permanentAddress  String
  salaries          Salary[]
  createdAt         DateTime @default(now())
}

model ProgramFee {
  id          Int      @id @default(autoincrement())
  program     String   @unique
  feeAmount   Float
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

## 🚀 **Steps to Implement:**

### **Step 1: Run Database Migration**

```bash
cd server
npx prisma migrate dev --name add_profile_and_settings_fields
npx prisma generate
```

This will:
- ✅ Add new fields to User, Student, Employee
- ✅ Create ProgramFee table
- ✅ Update Prisma Client

---

### **Step 2: Update Existing Data** (If you have existing records)

Since we're adding required fields, existing records will need data. Run this SQL:

```sql
-- Update existing Users (if any)
UPDATE "User" SET 
  "registrationNo" = 'REG' || LPAD(id::text, 6, '0'),
  "fatherName" = 'Update Required',
  "mobileNumber" = '0000000000',
  "permanentAddress" = 'Update Required',
  "currentAddress" = 'Update Required'
WHERE "registrationNo" IS NULL;

-- Update existing Students (if any)
UPDATE "Student" SET 
  "registrationNo" = 'STU' || LPAD(id::text, 6, '0'),
  "fatherName" = 'Update Required',
  "program" = 'General',
  "session" = '2024-2025',
  "phoneNumber" = '0000000000',
  "currentAddress" = 'Update Required',
  "permanentAddress" = 'Update Required'
WHERE "registrationNo" IS NULL;

-- Update existing Employees (if any)
UPDATE "Employee" SET 
  "registrationNo" = 'EMP' || LPAD(id::text, 6, '0'),
  "fatherName" = 'Update Required',
  "phoneNumber" = '0000000000',
  "joiningDate" = CURRENT_DATE,
  "salary" = 0,
  "emailAddress" = 'update@required.com',
  "currentAddress" = 'Update Required',
  "permanentAddress" = 'Update Required'
WHERE "registrationNo" IS NULL;
```

---

## 📱 **Frontend Pages to Create/Update:**

### 1. **Profile Page** (`client/src/pages/Profile.jsx`)
- Shows current user's profile information
- Admin and Accountant can view their profile
- Only Admin can edit profiles

### 2. **Settings Page** (`client/src/pages/Settings.jsx`)
- **Admin Only**
- Manage Program Fees
- Add/Edit/Delete program fee mappings

### 3. **Updated Students Page**
- Extended form with all new fields
- Auto-fetch fee based on program selection
- Email field is optional

### 4. **Updated Employees Page**
- Extended form with all new fields
- All fields mandatory

### 5. **Updated Sidebar**
- Add "Profile" at top
- Add "Settings" at bottom (Admin only)

---

## 🔧 **Backend Controllers to Create/Update:**

### 1. **Profile Controller** (`server/src/controllers/profileController.js`)
```javascript
// GET /api/profile - Get current user profile
// PUT /api/profile - Update current user profile
```

### 2. **Settings Controller** (`server/src/controllers/settingsController.js`)
```javascript
// GET /api/settings/programs - Get all program fees
// POST /api/settings/programs - Add new program fee
// PUT /api/settings/programs/:id - Update program fee
// DELETE /api/settings/programs/:id - Delete program fee
// GET /api/settings/programs/:program/fee - Get fee for specific program
```

### 3. **Updated Student Controller**
- Add all new fields to create/update operations
- Auto-assign fee from program

### 4. **Updated Employee Controller**
- Add all new fields to create/update operations

---

## 🎯 **Features:**

### **Auto-Fee Fetching:**
When admin adds a new student:
1. Select Program (e.g., "Computer Science")
2. System automatically fetches fee from ProgramFee table
3. Fee field auto-populates
4. Admin can override if needed

### **Role-Based Access:**
- ✅ **Admin**: Full CRUD on Students, Employees, Settings
- ✅ **Accountant**: Read-only on Students, Employees (no access to Settings)

### **Profile Management:**
- All users (Admin & Accountant) can view their profile
- Only Admin can update any profile

---

## 📊 **Sidebar Structure:**

```
┌─────────────────────────────┐
│ 👤 Profile (NEW - Top)      │
├─────────────────────────────┤
│ 📊 Dashboard                │
│ 👨‍🎓 Students                │
│ 👨‍💼 Employees (Admin Only)  │
│ 💰 Fees                     │
│ 💵 Salaries                 │
│ 📈 Reports                  │
├─────────────────────────────┤
│ ⚙️ Settings (NEW - Bottom)  │
│    (Admin Only)             │
└─────────────────────────────┘
```

---

## 🧪 **Testing Checklist:**

### **Profile Page:**
- [ ] Admin can view their profile
- [ ] Accountant can view their profile
- [ ] All fields display correctly

### **Settings Page:**
- [ ] Admin can add program fees
- [ ] Admin can edit program fees
- [ ] Admin can delete program fees
- [ ] Accountant cannot access Settings page

### **Student Registration:**
- [ ] All new fields are in the form
- [ ] Program selection auto-fetches fee
- [ ] Email field is optional
- [ ] Registration number auto-generates or manual input
- [ ] Accountant cannot add students (read-only)

### **Employee Management:**
- [ ] All new fields are in the form
- [ ] Joining date picker works
- [ ] Salary field accepts numbers
- [ ] Accountant cannot access Employees

---

## 🎨 **UI/UX Considerations:**

1. **Registration Numbers:**
   - Auto-generate format: `STU202400001`, `EMP202400001`, `REG202400001`
   - Or allow manual input

2. **Address Fields:**
   - Use textarea for better input
   - Consider "Same as Permanent Address" checkbox

3. **Program Dropdown:**
   - Populated from ProgramFee table
   - When selected, auto-fill fee field

4. **Validation:**
   - Phone numbers: format validation
   - Email: valid email format (optional for students)
   - Required fields highlighted

5. **Form Layout:**
   - Group related fields (Personal Info, Contact Info, Addresses)
   - Use sections/cards for better organization

---

## 📝 **Next Steps:**

1. ✅ Update Prisma schema (Done)
2. ⏳ Run migrations
3. ⏳ Create backend controllers (Profile, Settings)
4. ⏳ Create frontend pages (Profile, Settings)
5. ⏳ Update Student & Employee forms
6. ⏳ Update Sidebar
7. ⏳ Test all features
8. ⏳ Add validation

---

**Built with ❤️ by Yuxor Company**

