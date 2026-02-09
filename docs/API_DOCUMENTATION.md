# HARI API Documentation / เอกสาร API ของ HARI

[🇹🇭 ภาษาไทย](#ภาษาไทย) | [🇬🇧 English](#english)

---

## 🇹🇭 ภาษาไทย

### 📋 สารบัญ

1. [ข้อมูลทั่วไป](#1-ข้อมูลทั่วไป)
2. [Authentication](#2-authentication)
3. [Employee APIs](#3-employee-apis)
4. [Leave Management APIs](#4-leave-management-apis)
5. [Document APIs](#5-document-apis)
6. [Onboarding APIs](#6-onboarding-apis)
7. [Training APIs](#7-training-apis)
8. [Analytics APIs](#8-analytics-apis)
9. [Error Handling](#9-error-handling)

---

### 1. ข้อมูลทั่วไป

#### 1.1 Base URL

**Development:**
```
http://localhost:3001/api
```

**Production:**
```
https://your-production-url.com/api
```

#### 1.2 Authentication

API ส่วนใหญ่ต้องการ JWT Token ใน Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

#### 1.3 Response Format

**Success Response:**
```json
{
  "id": "uuid",
  "name": "John Doe",
  "email": "john@example.com"
}
```

**Error Response:**
```json
{
  "error": "Error message description"
}
```

#### 1.4 HTTP Status Codes

| Code | Description |
|------|-------------|
| 200  | OK - Request successful |
| 201  | Created - Resource created |
| 400  | Bad Request - Invalid input |
| 401  | Unauthorized - Authentication required |
| 403  | Forbidden - Insufficient permissions |
| 404  | Not Found - Resource not found |
| 500  | Internal Server Error |

---

### 2. Authentication

#### 2.1 Login

เข้าสู่ระบบและรับ JWT token

**Endpoint:**
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "admin@company.com",
  "password": "Admin123!@#"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@company.com",
    "role": "HR_ADMIN",
    "employee": {
      "id": "uuid",
      "firstName": "Admin",
      "lastName": "User",
      "department": "Human Resources",
      "position": "HR Manager"
    }
  }
}
```

**Error Responses:**
```json
// 400 Bad Request
{
  "error": "Email and password are required"
}

// 401 Unauthorized
{
  "error": "Invalid credentials"
}
```

---

#### 2.2 Change Password

เปลี่ยนรหัสผ่าน (ต้อง authenticate)

**Endpoint:**
```http
POST /api/auth/change-password
```

**Headers:**
```http
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword456!@#"
}
```

**Response (200 OK):**
```json
{
  "message": "Password changed successfully"
}
```

---

### 3. Employee APIs

#### 3.1 Get All Employees

ดึงรายการพนักงานทั้งหมด

**Endpoint:**
```http
GET /api/employees
```

**Headers:**
```http
Authorization: Bearer <token>
```

**Query Parameters:**
```
?department=Engineering
&status=Active
&search=john
```

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@company.com",
    "phone": "+66-123-456-789",
    "department": "Engineering",
    "position": "Software Engineer",
    "managerId": "uuid",
    "managerName": "Jane Smith",
    "joinDate": "2024-01-15",
    "status": "Active",
    "onboardingStatus": "Completed",
    "onboardingPercentage": 100,
    "avatar": "/uploads/avatars/john.jpg"
  }
]
```

---

#### 3.2 Get Employee by ID

ดึงข้อมูลพนักงานคนเดียว

**Endpoint:**
```http
GET /api/employees/:id
```

**Headers:**
```http
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@company.com",
  "phone": "+66-123-456-789",
  "department": "Engineering",
  "position": "Software Engineer",
  "managerId": "uuid",
  "joinDate": "2024-01-15",
  "status": "Active",
  "bio": "Experienced software engineer...",
  "address": "123 Main St, Bangkok",
  "emergencyContact": "Jane Doe (+66-987-654-321)",
  "leaveBalances": {
    "annual": 15,
    "sick": 10,
    "personal": 5
  },
  "onboarding": {
    "status": "Completed",
    "percentage": 100,
    "tasks": [
      {
        "id": "uuid",
        "title": "Complete paperwork",
        "completed": true
      }
    ]
  }
}
```

---

#### 3.3 Create Employee (Admin Only)

สร้างพนักงานใหม่

**Endpoint:**
```http
POST /api/employees
```

**Headers:**
```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@company.com",
  "phone": "+66-111-222-333",
  "department": "Marketing",
  "position": "Marketing Manager",
  "managerId": "uuid",
  "joinDate": "2024-02-01",
  "status": "Active",
  "password": "TempPassword123!@#"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@company.com",
  "message": "Employee created successfully"
}
```

---

#### 3.4 Update Employee

อัปเดตข้อมูลพนักงาน

**Endpoint:**
```http
PUT /api/employees/:id
```

**Headers:**
```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "phone": "+66-999-888-777",
  "position": "Senior Software Engineer",
  "bio": "Updated bio..."
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "message": "Employee updated successfully"
}
```

---

#### 3.5 Delete Employee (Admin Only)

ลบพนักงาน

**Endpoint:**
```http
DELETE /api/employees/:id
```

**Headers:**
```http
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "message": "Employee deleted successfully"
}
```

---

### 4. Leave Management APIs

#### 4.1 Get All Leave Requests

ดึงคำขอลาทั้งหมด

**Endpoint:**
```http
GET /api/leave-requests
```

**Headers:**
```http
Authorization: Bearer <token>
```

**Query Parameters:**
```
?status=Pending
&type=Annual
&employeeId=uuid
```

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "employeeId": "uuid",
    "employeeName": "John Doe",
    "type": "Annual",
    "startDate": "2024-03-15",
    "endDate": "2024-03-20",
    "daysCount": 4,
    "reason": "Family vacation",
    "status": "Pending",
    "reviewedBy": null,
    "createdAt": "2024-02-10T10:00:00Z"
  }
]
```

---

#### 4.2 Create Leave Request

สร้างคำขอลาใหม่

**Endpoint:**
```http
POST /api/leave-requests
```

**Headers:**
```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "type": "Annual",
  "startDate": "2024-03-15",
  "endDate": "2024-03-20",
  "reason": "Family vacation"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "status": "Pending",
  "message": "Leave request submitted successfully"
}
```

---

#### 4.3 Update Leave Status (Admin Only)

อนุมัติ/ปฏิเสธคำขอลา

**Endpoint:**
```http
PUT /api/leave-requests/:id
```

**Headers:**
```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "Approved"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "status": "Approved",
  "message": "Leave request updated successfully"
}
```

---

#### 4.4 Get Leave Balance

ดูยอดวันลาคงเหลือ

**Endpoint:**
```http
GET /api/leave-requests/balances/:employeeId
```

**Headers:**
```http
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "employeeId": "uuid",
  "balances": {
    "Annual": {
      "total": 15,
      "used": 5,
      "remaining": 10
    },
    "Sick": {
      "total": 10,
      "used": 2,
      "remaining": 8
    },
    "Personal": {
      "total": 5,
      "used": 0,
      "remaining": 5
    }
  }
}
```

---

### 5. Document APIs

#### 5.1 Get All Documents

ดึงเอกสารทั้งหมด

**Endpoint:**
```http
GET /api/documents
```

**Headers:**
```http
Authorization: Bearer <token>
```

**Query Parameters:**
```
?category=Policy
&search=handbook
```

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "name": "Employee Handbook 2024",
    "description": "Official employee handbook",
    "filePath": "/uploads/documents/handbook-2024.pdf",
    "fileType": "pdf",
    "fileSize": "2.5 MB",
    "category": "Policy",
    "uploadedBy": "Admin User",
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

---

#### 5.2 Upload Document

อัปโหลดเอกสารใหม่

**Endpoint:**
```http
POST /api/documents
```

**Headers:**
```http
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
```
file: [File]
name: "Employee Handbook 2024"
description: "Official employee handbook"
category: "Policy"
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "name": "Employee Handbook 2024",
  "filePath": "/uploads/documents/handbook-2024.pdf",
  "message": "Document uploaded successfully"
}
```

---

#### 5.3 Download Document

ดาวน์โหลดเอกสาร

**Endpoint:**
```http
GET /api/documents/:id/download
```

**Headers:**
```http
Authorization: Bearer <token>
```

**Response:**
- File stream with appropriate headers

---

#### 5.4 Delete Document

ลบเอกสาร

**Endpoint:**
```http
DELETE /api/documents/:id
```

**Headers:**
```http
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "message": "Document deleted successfully"
}
```

---

### 6. Onboarding APIs

#### 6.1 Get Onboarding Tasks

ดึงงาน onboarding ของพนักงาน

**Endpoint:**
```http
GET /api/onboarding/tasks/:employeeId
```

**Headers:**
```http
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "employeeId": "uuid",
    "title": "Complete I-9 Form",
    "description": "Fill out employment verification",
    "dueDate": "2024-02-15",
    "completed": false,
    "category": "Documentation"
  }
]
```

---

#### 6.2 Toggle Task Completion

เปลี่ยนสถานะความสำเร็จของงาน

**Endpoint:**
```http
PATCH /api/onboarding/tasks/:id/toggle
```

**Headers:**
```http
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "completed": true,
  "message": "Task status updated"
}
```

---

### 7. Training APIs

#### 7.1 Get Training Modules

ดึงหลักสูตรฝึกอบรมทั้งหมด

**Endpoint:**
```http
GET /api/training/modules
```

**Headers:**
```http
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "title": "Workplace Safety",
    "description": "Basic safety training",
    "duration": "2 hours",
    "category": "Safety",
    "required": true
  }
]
```

---

#### 7.2 Get Employee Training

ดึงข้อมูลการฝึกอบรมของพนักงาน

**Endpoint:**
```http
GET /api/training/employee/:employeeId
```

**Headers:**
```http
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "moduleId": "uuid",
    "moduleTitle": "Workplace Safety",
    "status": "Completed",
    "completedDate": "2024-01-20",
    "score": 95
  }
]
```

---

#### 7.3 Assign Training

มอบหมายหลักสูตรให้พนักงาน (Admin Only)

**Endpoint:**
```http
POST /api/training/assign
```

**Headers:**
```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "employeeId": "uuid",
  "moduleId": "uuid",
  "dueDate": "2024-03-01"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "message": "Training assigned successfully"
}
```

---

### 8. Analytics APIs

#### 8.1 Get Headcount Statistics

ดึงสถิติจำนวนพนักงาน

**Endpoint:**
```http
GET /api/analytics/headcount-stats
```

**Headers:**
```http
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
[
  {
    "name": "Jan",
    "value": 5
  },
  {
    "name": "Feb",
    "value": 8
  }
]
```

---

#### 8.2 Get Audit Logs (Admin Only)

ดึง audit logs

**Endpoint:**
```http
GET /api/analytics/audit-logs
```

**Headers:**
```http
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "user": "admin@company.com",
    "action": "LOGIN",
    "target": "System",
    "time": "Feb 9, 01:30 PM",
    "type": "user"
  }
]
```

---

### 9. Error Handling

#### 9.1 Common Errors

**401 Unauthorized:**
```json
{
  "error": "Access denied. No token provided."
}
```

**403 Forbidden:**
```json
{
  "error": "Access denied. Admin only."
}
```

**404 Not Found:**
```json
{
  "error": "Employee not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Failed to process request"
}
```

---

## 🇬🇧 English

### 📋 Table of Contents

1. [General Information](#1-general-information)
2. [Authentication](#2-authentication-1)
3. [Employee APIs](#3-employee-apis-1)
4. [Leave Management APIs](#4-leave-management-apis-1)
5. [Document APIs](#5-document-apis-1)
6. [Onboarding APIs](#6-onboarding-apis-1)
7. [Training APIs](#7-training-apis-1)
8. [Analytics APIs](#8-analytics-apis-1)
9. [Error Handling](#9-error-handling-1)

---

### 1. General Information

[Same content as Thai version with English descriptions]

---

### 2. Authentication

[Same content as Thai version with English descriptions]

---

### 3. Employee APIs

[Same content as Thai version with English descriptions]

---

### 4. Leave Management APIs

[Same content as Thai version with English descriptions]

---

### 5. Document APIs

[Same content as Thai version with English descriptions]

---

### 6. Onboarding APIs

[Same content as Thai version with English descriptions]

---

### 7. Training APIs

[Same content as Thai version with English descriptions]

---

### 8. Analytics APIs

[Same content as Thai version with English descriptions]

---

### 9. Error Handling

[Same content as Thai version with English descriptions]

---

## 📚 Additional Resources

- [Setup Guide](./SETUP_GUIDE.md)
- [Architecture Documentation](./ARCHITECTURE.md)
- [Swagger UI](http://localhost:3001/api-docs) - Interactive API documentation

---

**Need Help?** Open an issue on GitHub or check our troubleshooting guide.
