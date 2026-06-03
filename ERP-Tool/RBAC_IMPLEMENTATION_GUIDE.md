# RBAC System Implementation Guide

## Overview
This document provides a comprehensive guide to the Role-Based Access Control (RBAC) system implemented for the Logistics ERP software.

## Architecture

### Database Schema

The RBAC system uses the following database tables:

#### 1. ERPDepartment
- **id**: Primary key (UUID)
- **name**: Department name (unique)
- **code**: Department code (unique)
- **createdAt**: Timestamp

**Departments:**
- Finance (FIN)
- Human Resources (HR)
- Operations (OPS)
- Sales & Marketing (SAL)
- IT (IT)
- Sustainability (SUS)

#### 2. ERPRole
- **id**: Primary key (UUID)
- **name**: Role name (unique)
- **description**: Role description
- **departmentId**: Foreign key to ERPDepartment
- **createdAt**: Timestamp

**Roles:**
- finance_staff
- hr_staff
- operations_staff
- sales_marketing_staff
- it_staff
- sustainability_staff
- ceo (Superadmin)

#### 3. ModuleAccess
- **id**: Primary key (UUID)
- **roleId**: Foreign key to ERPRole
- **moduleKey**: Module identifier
- **canRead**: Boolean
- **canWrite**: Boolean
- **canExport**: Boolean
- **createdAt**: Timestamp

#### 4. ERPUser
- **id**: Primary key (UUID)
- **username**: Unique username
- **passwordHash**: Hashed password
- **fullName**: User's full name
- **email**: Unique email
- **roleId**: Foreign key to ERPRole
- **departmentId**: Foreign key to ERPRolepartment
- **isActive**: Boolean
- **isCEO**: Boolean
- **createdAt**: Timestamp
- **updatedAt**: Timestamp

#### 5. AccessRequest
- **id**: Primary key (UUID)
- **fullName**: Requester's full name
- **email**: Requester's email
- **department**: Requested department
- **reason**: Reason for access
- **status**: pending/approved/denied
- **reviewedBy**: Foreign key to ERPUser (CEO)
- **reviewedAt**: Timestamp
- **createdAt**: Timestamp

## Module Access Configuration

### Finance Staff
- **Modules**: Dashboard, Finance, Banking, Analytics Hub
- **Payroll**: Read-only access

### HR Staff
- **Modules**: Dashboard, Human Resources, Payroll, Healthcare, Education
- **Payroll**: Full read/write access

### Operations Staff
- **Modules**: Dashboard, Inventory, Manufacturing, Supply Chain, Procurement, Fixed Assets, Projects

### Sales & Marketing Staff
- **Modules**: Dashboard, CRM & Pipeline, E-Commerce, Marketing, Analytics Hub

### IT Staff
- **Modules**: Dashboard, Security, Migration Hub, RPA Automation, Analytics Hub

### Sustainability Staff
- **Modules**: Dashboard, Sustainability, Analytics Hub

### CEO / Superadmin
- **Modules**: All modules (full access)

## Backend Implementation

### Files Created/Modified

#### 1. Database Models
**File**: `backend/app/models/models.py`
- Added ERPRole, ERPDepartment, ModuleAccess, ERPUser, AccessRequest models

#### 2. Seed Script
**File**: `backend/seed_rbac.py`
- Creates departments, roles, module access permissions
- Creates default CEO user (username: ceo, password: admin123)

**Run seed script:**
```bash
cd backend
venv\Scripts\python.exe seed_rbac.py
```

#### 3. RBAC Router
**File**: `backend/app/routers/rbac.py`
- Access request endpoints
- User management endpoints
- Department and role listing endpoints

**Endpoints:**
- `POST /api/v1/rbac/access-request` - Submit access request
- `GET /api/v1/rbac/access-requests` - List all requests
- `GET /api/v1/rbac/access-requests/{id}` - Get specific request
- `POST /api/v1/rbac/access-requests/{id}/approve` - Approve request
- `POST /api/v1/rbac/access-requests/{id}/deny` - Deny request
- `GET /api/v1/rbac/departments` - List departments
- `GET /api/v1/rbac/roles` - List roles
- `GET /api/v1/rbac/roles/{id}/modules` - Get role module permissions
- `GET /api/v1/rbac/users` - List users
- `POST /api/v1/rbac/users` - Create user
- `PUT /api/v1/rbac/users/{id}/activate` - Activate user
- `PUT /api/v1/rbac/users/{id}/deactivate` - Deactivate user

#### 4. Authentication Router
**File**: `backend/app/routers/rbac_auth.py`
- Separate login routes for CEO and employees
- JWT token generation with role and module permissions
- Permission checking dependencies

**Endpoints:**
- `POST /api/v1/auth/admin/login` - CEO login
- `POST /api/v1/auth/login` - Employee login
- `GET /api/v1/auth/me` - Get current user info
- `POST /api/v1/auth/logout` - Logout

**Dependencies:**
- `get_current_user` - Get authenticated user from JWT
- `require_ceo` - Require CEO role
- `require_module_access(module_key, permission)` - Require specific module access

#### 5. Main App
**File**: `backend/app/main.py`
- Registered rbac_auth_router and rbac_router

## Frontend Implementation

### Files Created/Modified

#### 1. Access Request Form
**File**: `frontend/src/components/AccessRequestForm.jsx`
- Form for employees to request ERP access
- Fields: Full Name, Email, Department, Reason
- Submits to `/api/v1/rbac/access-request`

#### 2. Admin Approval Panel
**File**: `frontend/src/components/AdminApprovalPanel.jsx`
- CEO panel to review access requests
- Filter by status (pending/approved/denied)
- Approve requests with role assignment
- Deny requests

#### 3. Sidebar (Modified)
**File**: `frontend/src/components/layout/Sidebar.jsx`
- Dynamically renders only allowed modules
- Filters MODULES_CONFIG based on user permissions
- CEO sees all modules

#### 4. Store (Modified)
**File**: `frontend/src/store/useERPStore.js`
- Added `userPermissions` state
- Updated `setCurrentUser` to accept permissions
- Added `setUserPermissions` action
- Updated `logout` to clear permissions

## Authentication Flow

### CEO Login Flow
1. CEO navigates to `/admin/login`
2. Enters username and password
3. Backend validates credentials and checks `isCEO` flag
4. Backend generates JWT with:
   - User ID
   - Username
   - isCEO: true
   - Role ID
   - Department ID
5. Backend returns:
   - Access token
   - User info
   - Module permissions (all modules)
6. Frontend stores token, user info, and permissions
7. Sidebar renders all modules

### Employee Login Flow
1. Employee navigates to `/login`
2. Enters username and password
3. Backend validates credentials
4. Backend generates JWT with:
   - User ID
   - Username
   - isCEO: false
   - Role ID
   - Department ID
5. Backend returns:
   - Access token
   - User info
   - Module permissions (based on role)
6. Frontend stores token, user info, and permissions
7. Sidebar renders only allowed modules

### Access Request Flow
1. Employee submits access request form
2. Request saved with status = "pending"
3. CEO receives notification in admin panel
4. CEO reviews request
5. On APPROVE:
   - CEO selects role for the employee
   - CEO sets username and password
   - System creates user account
   - Request status updated to "approved"
   - Employee receives credentials
6. On DENY:
   - Request status updated to "denied"
   - Employee notified

## Permission Checking

### Backend Middleware

The `require_module_access` dependency factory checks permissions:

```python
@router.get("/finance/data")
async def get_finance_data(
    current_user: ERPUser = Depends(require_module_access("finance", "canRead"))
):
    # Only users with finance read access can access this endpoint
    pass
```

### Frontend Permission Checking

The sidebar filters modules based on user permissions:

```javascript
const allowedModules = MODULES_CONFIG.filter((mod) => {
  if (currentUser?.isCEO) return true;
  
  const hasPermission = userPermissions?.some(
    (perm) => perm.moduleKey === mod.id && perm.canRead
  );
  
  return hasPermission;
});
```

## Special Rules Implementation

### Payroll Access
- Finance staff: Read-only (canRead: true, canWrite: false)
- HR staff: Full access (canRead: true, canWrite: true, canExport: true)

### Analytics Hub
- Shared across Finance, Sales, IT, Sustainability
- Each role sees only their own department's data
- Implement data filtering by department in Analytics Hub module

### Security, Migration Hub, RPA Automation
- IT staff only
- Completely hidden from all other roles
- Backend middleware enforces access

### Dashboard
- Visible to ALL roles after login
- No permission check required

## API Permission Guard

To protect API endpoints, use the `require_module_access` dependency:

```python
from app.routers.rbac_auth import require_module_access

@router.get("/api/v1/finance/accounts")
async def get_accounts(
    current_user: ERPUser = Depends(require_module_access("finance", "canRead"))
):
    # Endpoint protected
    pass

@router.post("/api/v1/finance/accounts")
async def create_account(
    account_data: AccountCreate,
    current_user: ERPUser = Depends(require_module_access("finance", "canWrite"))
):
    # Write permission required
    pass
```

## Analytics Hub Data Filtering

To implement department-based data filtering in Analytics Hub:

```python
@router.get("/api/v1/analytics/data")
async def get_analytics_data(
    current_user: ERPUser = Depends(require_module_access("analytics_hub", "canRead")),
    db: Session = Depends(get_db)
):
    # CEO sees all data
    if current_user.isCEO:
        return db.query(AnalyticsData).all()
    
    # Other users see only their department's data
    return db.query(AnalyticsData).filter(
        AnalyticsData.departmentId == current_user.departmentId
    ).all()
```

## Security Considerations

1. **JWT Secret**: Change `JWT_SECRET` in production
2. **Password Hashing**: All passwords are hashed using bcrypt
3. **HTTPS**: Use HTTPS in production
4. **Token Expiration**: Default 24 hours
5. **CEO Password**: Change default CEO password immediately
6. **SQL Injection**: Use SQLAlchemy ORM to prevent SQL injection
7. **XSS**: Frontend should sanitize user inputs
8. **CSRF**: Implement CSRF protection for state-changing operations

## Testing

### Test CEO Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username": "ceo", "password": "admin123"}'
```

### Test Employee Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "employee", "password": "password"}'
```

### Test Access Request
```bash
curl -X POST http://localhost:5000/api/v1/rbac/access-request \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john@company.com",
    "department": "Finance",
    "reason": "Need access for finance operations"
  }'
```

## Deployment Checklist

- [ ] Change JWT_SECRET in production
- [ ] Change default CEO password
- [ ] Enable HTTPS
- [ ] Set up database backups
- [ ] Configure CORS for production domain
- [ ] Implement rate limiting
- [ ] Set up monitoring and logging
- [ ] Test all permission checks
- [ ] Document user roles and permissions
- [ ] Train users on access request process

## Troubleshooting

### Issue: User can't see modules
- Check if user has permissions in database
- Verify permissions are returned in login response
- Check frontend store for userPermissions
- Verify sidebar filtering logic

### Issue: Permission denied on API
- Check if user has required permission in ModuleAccess table
- Verify JWT token is valid
- Check if middleware is applied to endpoint
- Verify module key matches in permission check

### Issue: CEO can't approve requests
- Verify CEO isCEO flag is true
- Check if CEO has admin permissions
- Verify JWT token is valid
- Check if reviewer_id is being passed correctly

## Future Enhancements

1. **Two-Factor Authentication (2FA)** for CEO login
2. **Audit Logging** for all permission changes
3. **Role Hierarchy** with inheritance
4. **Time-based Access Control** (working hours only)
5. **IP Whitelisting** for CEO access
6. **Session Management** with forced logout
7. **Permission Templates** for quick role setup
8. **Bulk User Import** from CSV
9. **Self-Service Password Reset**
10. **Multi-factor Authentication** for all users

## Support

For issues or questions about the RBAC system, refer to:
- Backend API documentation: http://localhost:5000/docs
- Database schema: `backend/app/models/models.py`
- API endpoints: `backend/app/routers/rbac.py` and `rbac_auth.py`
