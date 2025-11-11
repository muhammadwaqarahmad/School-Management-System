# Role-Based Permissions Implementation

## Overview
This document outlines the complete implementation of role-based access control for profile and user management in the School Management System.

## Permission Matrix

| Action | Super Admin | Admin | Accountant |
|--------|-------------|-------|------------|
| **Profile Management** |
| Edit own profile | ✅ Yes | ❌ No | ❌ No |
| View own profile | ✅ Yes | ✅ Yes | ✅ Yes |
| **User Management** |
| Access Users page | ✅ Yes | ✅ Yes | ❌ No |
| View all users | ✅ Yes | ❌ No (Accountants only) | ❌ No |
| Create Super Admin | ✅ Yes | ❌ No | ❌ No |
| Create Admin | ✅ Yes | ❌ No | ❌ No |
| Create Accountant | ✅ Yes | ✅ Yes | ❌ No |
| Edit Super Admin | ✅ Yes | ❌ No | ❌ No |
| Edit Admin | ✅ Yes | ❌ No | ❌ No |
| Edit Accountant | ✅ Yes | ✅ Yes | ❌ No |
| Delete Super Admin | ✅ Yes | ❌ No | ❌ No |
| Delete Admin | ✅ Yes | ❌ No | ❌ No |
| Delete Accountant | ✅ Yes | ✅ Yes | ❌ No |
| Reset password (any user) | ✅ Yes | ❌ No (Accountants only) | ❌ No |

## Frontend Implementation

### 1. Profile Page (`client/src/pages/Profile.jsx`)
- **Changes:**
  - Only SUPER_ADMIN users can see the "Edit Profile" button
  - Admin and Accountant users see a "Read Only" badge
  - Dynamic subtitle text explaining permission restrictions
  
- **User Experience:**
  - Super Admin: Can edit all profile fields
  - Admin/Accountant: Can only view their profile (all inputs disabled)

### 2. Users Page (`client/src/pages/Users.jsx`)
- **Access Control:**
  - Page accessible to SUPER_ADMIN and ADMIN roles
  - Accountants cannot access this page
  
- **Super Admin View:**
  - See all users (Super Admins, Admins, Accountants)
  - Can create users with any role
  - Can edit/delete any user
  - Full access to all user management features
  
- **Admin View:**
  - See only Accountant users
  - Can only create Accountant accounts
  - Role dropdown is disabled and locked to "Accountant"
  - Can only edit/delete Accountant accounts
  - Page title changes to "Accountant Management"
  - Helpful info box explains restrictions

### 3. Sidebar Navigation (`client/src/components/Sidebar.jsx`)
- Updated "Users" menu item to be visible for both SUPER_ADMIN and ADMIN roles

### 4. App Routes (`client/src/App.jsx`)
- Updated Users route to allow both SUPER_ADMIN and ADMIN roles

## Backend Implementation

### 1. User Controller (`server/src/controllers/userController.js`)

#### `createUser` Function
- Validates that only SUPER_ADMIN can create SUPER_ADMIN or ADMIN accounts
- ADMINs attempting to create Admin/Super Admin accounts receive 403 Forbidden error
- Error message: "Only SUPER_ADMIN can create SUPER_ADMIN or ADMIN accounts. You can only create ACCOUNTANT accounts."

#### `updateUser` Function
- Validates that only SUPER_ADMIN can assign SUPER_ADMIN or ADMIN roles
- Prevents ADMINs from editing SUPER_ADMIN or ADMIN users
- Error messages:
  - Role assignment: "Only SUPER_ADMIN can assign SUPER_ADMIN or ADMIN role"
  - Editing restriction: "You can only edit ACCOUNTANT accounts"

#### `deleteUser` Function
- Prevents ADMINs from deleting SUPER_ADMIN or ADMIN users
- Maintains existing protection against self-deletion
- Error message: "You can only delete ACCOUNTANT accounts"

#### `resetUserPassword` Function
- Prevents ADMINs from resetting passwords for SUPER_ADMIN or ADMIN users
- Error message: "You can only reset passwords for ACCOUNTANT accounts"

### 2. User Routes (`server/src/routes/userRoutes.js`)
- Changed from `superAdminOnly` to `adminOnly` middleware
- Allows both SUPER_ADMIN and ADMIN to access user management endpoints
- Backend validation ensures proper role-based restrictions

## Security Features

### Frontend Security
1. **UI-level restrictions:**
   - Conditional rendering based on user role
   - Disabled form fields for restricted actions
   - Filtered data display (Admins only see Accountants)

2. **User feedback:**
   - Clear messaging about permission restrictions
   - Helpful tooltips and info boxes
   - Disabled buttons with visual indicators

### Backend Security
1. **Multi-layer validation:**
   - Authentication check (user must be logged in)
   - Role-based authorization (user must have required role)
   - Action-specific validation (e.g., can't edit higher-privilege users)

2. **Consistent error messages:**
   - Clear feedback about what roles are required
   - Specific messages about what actions are allowed

3. **Data protection:**
   - Backend validation ensures even if frontend is bypassed, restrictions are enforced
   - Prevents privilege escalation attacks
   - Protects against unauthorized access to higher-privilege accounts

## Testing Checklist

### As Super Admin:
- ✅ Can edit own profile
- ✅ Can view all users
- ✅ Can create Super Admin, Admin, and Accountant accounts
- ✅ Can edit any user
- ✅ Can delete any user (except self)
- ✅ Can reset password for any user

### As Admin:
- ✅ Cannot edit own profile (Read Only badge shown)
- ✅ Can access Users page (shows as "Accountant Management")
- ✅ Can only see Accountant users in the list
- ✅ Can only create Accountant accounts (role dropdown locked)
- ✅ Can edit Accountant accounts
- ✅ Can delete Accountant accounts
- ✅ Can reset passwords for Accountants
- ✅ Cannot create/edit/delete Admin or Super Admin accounts
- ✅ Receives clear error messages when attempting unauthorized actions

### As Accountant:
- ✅ Cannot edit own profile (Read Only badge shown)
- ✅ Cannot access Users page
- ✅ Can view all other allowed pages (Dashboard, Students, Fees, Salaries, Expenses, Reports)

## Files Modified

### Frontend:
1. `client/src/pages/Profile.jsx` - Added role-based edit restrictions
2. `client/src/pages/Users.jsx` - Added role-based filtering and UI changes
3. `client/src/components/Sidebar.jsx` - Updated Users menu visibility
4. `client/src/App.jsx` - Updated Users route permissions

### Backend:
1. `server/src/controllers/userController.js` - Added role-based validation
2. `server/src/routes/userRoutes.js` - Changed middleware to allow Admins

## Benefits

1. **Enhanced Security:** Multi-layer protection prevents unauthorized access
2. **Clear User Experience:** Users understand their permissions through UI cues
3. **Scalable Design:** Easy to modify or extend permissions in the future
4. **Audit Trail:** All permission checks are logged through error messages
5. **Consistent Enforcement:** Both frontend and backend enforce the same rules

## Future Enhancements

1. Add activity logging for user management actions
2. Implement email notifications for user creation/deletion
3. Add bulk user management features for Admins
4. Create detailed permission audit reports
5. Implement time-based or conditional permissions

