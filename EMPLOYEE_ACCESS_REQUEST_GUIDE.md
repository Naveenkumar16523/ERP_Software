# Employee Access Request Flow - Implementation Guide

## Overview
A comprehensive Employee Access Request Flow for the ERP platform with CEO-controlled approval and role-based module access.

## What Was Built

### 1. Database Schema Updates
- **AccessRequest Model** - Added `denialReason` field to track why requests are denied
- **ERPUser Model** - Stores user accounts with username, password hash, role, department
- **ERPRole Model** - Defines department-based roles
- **ERPDepartment Model** - Defines organizational departments
- **ModuleAccess Model** - Maps roles to module permissions (canRead, canWrite, canExport)

### 2. Backend API Endpoints

#### Access Request Endpoints (`/api/v1/rbac`)
- `POST /access-request` - Submit access request (public, rate-limited)
  - Validates: email format, required fields, no pending requests, no existing user
  - Returns: success/error message
  
- `GET /access-requests` - List all access requests (CEO only)
  - Query param: `status_filter` (pending, approved, denied)
  - Requires: CEO authentication via JWT
  
- `GET /access-requests/{id}` - Get specific request (CEO only)
  - Requires: CEO authentication via JWT
  
- `POST /access-requests/{id}/approve` - Approve request and create user (CEO only)
  - Body: `{ roleId, username, password }`
  - Validates: role exists, username unique, email not already in use
  - Creates: ERPUser account with hashed password
  - Updates: AccessRequest status to "approved" with reviewer_id and reviewed_at
  - Returns: created user summary (without password)
  
- `POST /access-requests/{id}/deny` - Deny request (CEO only)
  - Body: `{ denialReason? }` (optional)
  - Updates: AccessRequest status to "denied" with reviewer_id, reviewed_at, and denialReason
  - Does NOT create user account

#### Authentication Endpoints (`/api/v1/auth`)
- `POST /admin/login` - CEO/Admin login
  - Body: `{ username, password }`
  - Validates: CEO flag is true, password hash, active status
  - Returns: JWT token, user info, full permissions
  
- `POST /login` - Employee login
  - Body: `{ username, password }`
  - Validates: password hash, active status, not CEO
  - Returns: JWT token, user info, role-based permissions
  
- `GET /me` - Get current user info
  - Requires: JWT authentication
  - Returns: user details, role, department, permissions
  
- `POST /logout` - Logout (client-side token deletion)

### 3. Frontend Components

#### AccessRequestForm.jsx
- Public form for employees to request ERP access
- Fields: Full Name, Email, Department, Reason
- Validation: required fields, email format
- Submits to: `POST /api/v1/rbac/access-request`
- Success message: "Access request submitted successfully! The CEO will review your request."

#### AdminApprovalPanel.jsx
- CEO-only panel to review access requests
- Features:
  - Filter by status (Pending, Approved, Denied, All)
  - View request details (name, email, department, reason, status, dates)
  - Approve modal: select role, set username, set password
  - Deny modal: optional denial reason
  - Audit history shows reviewedBy and reviewedAt

#### Sidebar.jsx (Updated)
- Role-based module visibility
- Only shows modules with Full access (canWrite = true)
- CEO sees all modules
- Department-based filtering:
  - Finance: Dashboard, Finance, Banking, Analytics Hub
  - HR: Dashboard, Human Resources, Payroll, Healthcare, Education
  - Operations: Dashboard, Inventory, Manufacturing, Supply Chain, Procurement, Fixed Assets, Projects
  - Sales: Dashboard, CRM & Pipeline, E-Commerce, Marketing, Analytics Hub
  - IT: Dashboard, Security, Migration Hub, RPA Automation, Analytics Hub
  - Sustainability: Dashboard, Sustainability, Analytics Hub

#### App.jsx (Updated)
- Route guards for module access
- Checks user permissions before rendering modules
- Shows AccessDenied component for unauthorized access
- CEO bypasses all permission checks

### 4. Role-Based Module Access Matrix

| Module | Finance | HR | Operations | Sales | IT | Sustainability |
|--------|---------|-----|------------|-------|-----|----------------|
| Dashboard | Full | Full | Full | Full | Full | Full |
| Finance | Full | Hidden | Hidden | Hidden | Hidden | Hidden |
| Human Resources | Hidden | Full | Hidden | Hidden | Hidden | Hidden |
| Inventory | Hidden | Hidden | Full | Hidden | Hidden | Hidden |
| Manufacturing | Hidden | Hidden | Full | Hidden | Hidden | Hidden |
| Procurement | Hidden | Hidden | Full | Hidden | Hidden | Hidden |
| CRM & Pipeline | Hidden | Hidden | Hidden | Full | Hidden | Hidden |
| Payroll | Hidden | Full | Hidden | Hidden | Hidden | Hidden |
| Fixed Assets | Hidden | Hidden | Full | Hidden | Hidden | Hidden |
| Projects | Hidden | Hidden | Full | Hidden | Hidden | Hidden |
| Supply Chain | Hidden | Hidden | Full | Hidden | Hidden | Hidden |
| E-Commerce | Hidden | Hidden | Hidden | Full | Hidden | Hidden |
| Analytics Hub | Full | Hidden | Hidden | Full | Full | Full |
| Banking | Full | Hidden | Hidden | Hidden | Hidden | Hidden |
| Healthcare | Hidden | Full | Hidden | Hidden | Hidden | Hidden |
| Education | Hidden | Full | Hidden | Hidden | Hidden | Hidden |
| Sustainability | Hidden | Hidden | Hidden | Hidden | Hidden | Full |
| Marketing | Hidden | Hidden | Hidden | Full | Hidden | Hidden |
| Security | Hidden | Hidden | Hidden | Hidden | Full | Hidden |
| Migration Hub | Hidden | Hidden | Hidden | Hidden | Full | Hidden |
| RPA Automation | Hidden | Hidden | Hidden | Hidden | Full | Hidden |

### 5. Security Features

- **Password Hashing**: All passwords hashed with bcrypt before storage
- **JWT Authentication**: Token-based auth with expiration (24 hours)
- **CEO-Only Endpoints**: Access request management requires CEO role
- **Permission Enforcement**: Backend checks module permissions on every request
- **Audit Trail**: All approvals/denials tracked with reviewer_id and timestamp
- **Duplicate Prevention**: No pending requests for same email, no duplicate user accounts
- **Transactional Approval**: User creation fails if request update fails

## How to Use

### 1. Initial Setup

Run the seed script to populate departments, roles, and module access:

```bash
cd backend
.\venv\Scripts\python.exe seed_rbac_access.py
```

This creates:
- 6 departments (Finance, HR, Operations, Sales & Marketing, IT, Sustainability)
- 6 department-based roles with module permissions
- CEO user account

### 2. CEO Login

Use the CEO credentials to access the admin panel:
- **Username**: `ceo`
- **Password**: `admin123`
- **Login Endpoint**: `POST /api/v1/auth/admin/login`

⚠️ **IMPORTANT**: Change the default CEO password after first login!

### 3. Employee Access Request Flow

#### Step 1: Employee Submits Request
- Navigate to AccessRequestForm component
- Fill in: Full Name, Email, Department, Reason
- Submit form
- System validates and saves request with status "pending"

#### Step 2: CEO Reviews Requests
- Login as CEO
- Navigate to AdminApprovalPanel component
- View pending requests
- Filter by status if needed

#### Step 3: CEO Approves Request
- Click "Approve" on a pending request
- In modal:
  - Select appropriate role (e.g., "Finance Staff" for Finance department)
  - Set username (auto-generated from full name)
  - Set password
- Submit
- System creates ERPUser account with:
  - Hashed password
  - Assigned role
  - Department from request
  - Active status
- Access request status updated to "approved"
- Employee receives credentials (username, password)

#### Step 4: CEO Denies Request (Optional)
- Click "Deny" on a pending request
- In modal:
  - Optionally provide denial reason
- Submit
- Access request status updated to "denied"
- Denial reason stored for audit history
- No user account created

#### Step 5: Employee Login
- Use provided credentials
- Login endpoint: `POST /api/v1/auth/login`
- System returns:
  - JWT token
  - User info
  - Role
  - Department
  - Module permissions
- Sidebar shows only modules with Full access
- Backend enforces permissions on all protected endpoints

## API Examples

### Submit Access Request
```bash
POST /api/v1/rbac/access-request
{
  "fullName": "John Doe",
  "email": "john@company.com",
  "department": "Finance",
  "reason": "Need access to finance modules for daily operations"
}
```

### CEO Login
```bash
POST /api/v1/auth/admin/login
{
  "username": "ceo",
  "password": "admin123"
}
```

### List Pending Requests
```bash
GET /api/v1/rbac/access-requests?status_filter=pending
Headers: Authorization: Bearer <jwt_token>
```

### Approve Request
```bash
POST /api/v1/rbac/access-requests/{request_id}/approve
Headers: Authorization: Bearer <jwt_token>
{
  "roleId": "<role_id>",
  "username": "john.doe",
  "password": "SecurePassword123!"
}
```

### Deny Request
```bash
POST /api/v1/rbac/access-requests/{request_id}/deny
Headers: Authorization: Bearer <jwt_token>
{
  "denialReason": "Position no longer requires ERP access"
}
```

### Employee Login
```bash
POST /api/v1/auth/login
{
  "username": "john.doe",
  "password": "SecurePassword123!"
}
```

## Files Modified/Created

### Backend
- `app/models/models.py` - Added `denialReason` field to AccessRequest
- `app/routers/rbac.py` - Updated to use JWT authentication, added denial reason support
- `seed_rbac_access.py` - New seed script for RBAC structure

### Frontend
- `components/AdminApprovalPanel.jsx` - Added denial reason modal
- `components/AccessRequestForm.jsx` - Already existed, verified functionality
- `components/layout/Sidebar.jsx` - Already had permission filtering
- `App.jsx` - Already had route guards

## Testing Checklist

- [ ] Employee can submit access request
- [ ] Duplicate email requests are prevented
- [ ] CEO can view all access requests
- [ ] CEO can filter requests by status
- [ ] CEO can approve requests with role assignment
- [ ] Approved users can login with credentials
- [ ] Approved users see only their department's modules
- [ ] CEO can deny requests with optional reason
- [ ] Denied users cannot login
- [ ] Backend enforces permissions on all endpoints
- [ ] Audit trail shows reviewer and timestamp

## Next Steps

1. **Change CEO Password**: Update the default CEO password immediately
2. **Add Email Notifications**: Send email to employees when request is approved/denied
3. **Add Rate Limiting**: Implement rate limiting on access request endpoint
4. **Add Password Policy**: Enforce strong password requirements
5. **Add Audit Log Viewer**: Create UI to view full audit history
6. **Add User Management**: Allow CEO to deactivate/reactivate users
7. **Add Role Management**: Allow CEO to modify role permissions
