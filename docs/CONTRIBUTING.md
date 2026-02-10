# Contributing Guide / คู่มือการมีส่วนร่วม

[🇹🇭 ภาษาไทย](#ภาษาไทย) | [🇬🇧 English](#english)

---

## 🇹🇭 ภาษาไทย

### 🎉 ยินดีต้อนรับสู่ HARI!

เราขอขอบคุณที่คุณสนใจมีส่วนร่วมในโปรเจค HARI! เอกสารนี้จะแนะนำวิธีการมีส่วนร่วมในโปรเจคของเรา

---

### 📋 สารบัญ

1. [Code of Conduct](#1-code-of-conduct)
2. [การเริ่มต้น](#2-การเริ่มต้น)
3. [Development Workflow](#3-development-workflow)
4. [Coding Standards](#4-coding-standards)
5. [Commit Guidelines](#5-commit-guidelines)
6. [Pull Request Process](#6-pull-request-process)
7. [Testing](#7-testing)
8. [Documentation](#8-documentation)

---

### 1. Code of Conduct

#### 1.1 Our Pledge

เราให้คำมั่นว่าจะสร้างสภาพแวดล้อมที่:
- 🤝 เป็นมิตรและต้อนรับทุกคน
- 💬 เคารพความคิดเห็นที่แตกต่าง
- 🚫 ไม่ยอมรับการล่วงละเมิดหรือการกลั่นแกล้ง
- ✨ สนับสนุนการเรียนรู้และการพัฒนา

#### 1.2 Expected Behavior

- ใช้ภาษาที่เป็นมิตร
- เคารพมุมมองและประสบการณ์ที่แตกต่าง
- ยอมรับ feedback อย่างสร้างสรรค์
- มุ่งเน้นที่ดีที่สุดสำหรับชุมชน

---

### 2. การเริ่มต้น

#### 2.1 Fork และ Clone Repository

```bash
# Fork repository บน GitHub
# จากนั้น clone ลงเครื่อง

git clone https://github.com/YOUR-USERNAME/hari-hr-system.git
cd hari-hr-system
```

#### 2.2 ติดตั้ง Dependencies

```bash
npm install
```

#### 2.3 Setup Environment

สร้างไฟล์ `.env` ตาม [Setup Guide](./SETUP_GUIDE.md)

#### 2.4 รัน Development Server

```bash
npm run dev
```

---

### 3. Development Workflow

#### 3.1 สร้าง Feature Branch

```bash
# อัปเดต main branch ให้เป็นเวอร์ชันล่าสุด
git checkout main
git pull origin main

# สร้าง feature branch ใหม่
git checkout -b feature/your-feature-name
```

**Branch Naming Convention:**
- `feature/` - สำหรับ features ใหม่
- `fix/` - สำหรับ bug fixes
- `docs/` - สำหรับการอัปเดตเอกสาร
- `refactor/` - สำหรับ code refactoring
- `test/` - สำหรับเพิ่ม tests

**ตัวอย่าง:**
```
feature/add-payroll-module
fix/employee-list-pagination
docs/update-api-documentation
refactor/clean-architecture-auth
```

#### 3.2 ทำการเปลี่ยนแปลง

1. เขียนโค้ดตาม [Coding Standards](#4-coding-standards)
2. Test การเปลี่ยนแปลงของคุณ
3. Commit การเปลี่ยนแปลงตาม [Commit Guidelines](#5-commit-guidelines)

---

### 4. Coding Standards

#### 4.1 TypeScript

```typescript
// ✅ Good
interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

function getFullName(employee: Employee): string {
  return `${employee.firstName} ${employee.lastName}`;
}

// ❌ Bad
function getFullName(emp: any) {
  return emp.firstName + " " + emp.lastName;
}
```

#### 4.2 React Components

```tsx
// ✅ Good - Functional Component with TypeScript
interface EmployeeCardProps {
  employee: Employee;
  onEdit: (id: string) => void;
}

export const EmployeeCard: React.FC<EmployeeCardProps> = ({ employee, onEdit }) => {
  return (
    <div className="card">
      <h3>{employee.firstName} {employee.lastName}</h3>
      <button onClick={() => onEdit(employee.id)}>Edit</button>
    </div>
  );
};

// ❌ Bad - No types, unclear props
export const EmployeeCard = (props) => {
  return <div>{props.employee.name}</div>;
};
```

#### 4.3 Naming Conventions

**Variables:**
```typescript
// ✅ Good - camelCase
const employeeList = [];
const isAuthenticated = true;
const maxRetryCount = 3;

// ❌ Bad
const EmployeeList = [];
const is_authenticated = true;
```

**Components:**
```typescript
// ✅ Good - PascalCase
const EmployeeList = () => {};
const DashboardCard = () => {};

// ❌ Bad
const employeeList = () => {};
const dashboard_card = () => {};
```

**Constants:**
```typescript
// ✅ Good - UPPER_SNAKE_CASE
const API_BASE_URL = 'http://localhost:3001';
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// ❌ Bad
const apiBaseUrl = 'http://localhost:3001';
```

#### 4.4 Code Organization

```typescript
// Import order:
// 1. React imports
import React, { useState, useEffect } from 'react';

// 2. Third-party imports
import { useNavigate } from 'react-router-dom';

// 3. Local imports
import { api } from '../lib/api';
import { Employee } from '../types';
import { formatDate } from '../lib/utils';

// 4. Styles
import './EmployeeList.css';
```

---

### 5. Commit Guidelines

#### 5.1 Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### 5.2 Types

- `feat`: Feature ใหม่
- `fix`: Bug fix
- `docs`: Documentation เปลี่ยนแปลง
- `style`: การเปลี่ยนแปลงที่ไม่กระทบ code (formatting, whitespace)
- `refactor`: Code refactoring
- `test`: เพิ่มหรือแก้ tests
- `chore`: เปลี่ยนแปลง build process หรือ tools

#### 5.3 ตัวอย่าง Commit Messages

```bash
# ✅ Good
git commit -m "feat(employees): add employee search filter"
git commit -m "fix(auth): resolve JWT token expiration issue"
git commit -m "docs: update API documentation for leave requests"
git commit -m "refactor(dashboard): extract chart components"

# ❌ Bad
git commit -m "update code"
git commit -m "fix bug"
git commit -m "asdf"
```

#### 5.4 Commit Message Examples

**Feature:**
```
feat(payroll): add payroll calculation module

- Implement salary calculation logic
- Add deduction and bonus handling
- Create payroll report generation

Closes #123
```

**Bug Fix:**
```
fix(leave): correct leave balance calculation

Fixed an issue where sick leave was being deducted
from annual leave balance instead of sick leave balance.

Fixes #456
```

**Documentation:**
```
docs: add API documentation for training module

Added comprehensive documentation including:
- Endpoint descriptions
- Request/response examples
- Error handling
```

---

### 6. Pull Request Process

#### 6.1 ก่อนสร้าง Pull Request

1. ✅ อัปเดต branch ของคุณให้ตรงกับ main
```bash
git fetch origin
git rebase origin/main
```

2. ✅ ตรวจสอบว่าโค้ดทำงานได้
```bash
npm run dev
# ทดสอบ features ที่เปลี่ยนแปลง
```

3. ✅ รัน tests (ถ้ามี)
```bash
npm run test
```

4. ✅ ตรวจสอบ code style
```bash
npm run lint
```

#### 6.2 สร้าง Pull Request

1. Push branch ของคุณ:
```bash
git push origin feature/your-feature-name
```

2. ไปที่ GitHub และสร้าง Pull Request

3. กรอกข้อมูลตาม PR Template:

```markdown
## Description
สรุปสั้นๆ ว่าเปลี่ยนแปลงอะไร

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## How Has This Been Tested?
อธิบายว่าทดสอบอย่างไร

## Checklist
- [ ] โค้ดทำงานได้ปกติ
- [ ] เพิ่ม/อัปเดต tests (ถ้าจำเป็น)
- [ ] เพิ่ม/อัปเดต documentation (ถ้าจำเป็น)
- [ ] ไม่มี breaking changes (หรือได้ระบุไว้)

## Screenshots (ถ้ามี)
แนบ screenshots หรือ GIFs

## Related Issues
Closes #123
```

#### 6.3 หลังสร้าง Pull Request

- 🔔 รอ code review จาก maintainers
- 💬 ตอบคำถามหรือ feedback
- 🔄 ทำการเปลี่ยนแปลงตาม feedback
- ✅ หลัง approve จะมีการ merge

---

### 7. Testing

#### 7.1 Unit Tests

```typescript
// tests/services/EmployeeService.test.ts
import { describe, it, expect } from '@jest/globals';
import { EmployeeService } from '../services/EmployeeService';

describe('EmployeeService', () => {
  describe('getFullName', () => {
    it('should return full name', () => {
      const employee = {
        firstName: 'John',
        lastName: 'Doe'
      };
      const result = EmployeeService.getFullName(employee);
      expect(result).toBe('John Doe');
    });
  });
});
```

#### 7.2 Integration Tests

```typescript
// tests/api/employees.test.ts
import request from 'supertest';
import app from '../src/index';

describe('GET /api/employees', () => {
  it('should return list of employees', async () => {
    const response = await request(app)
      .get('/api/employees')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });
});
```

---

### 8. Documentation

#### 8.1 Code Comments

```typescript
// ✅ Good - อธิบายทำไม ไม่ใช่ทำอะไร
// Calculate days between two dates, excluding weekends
function calculateWorkdays(startDate: Date, endDate: Date): number {
  // Implementation
}

// ❌ Bad - อธิบายสิ่งที่โค้ดทำได้ชัดเจนอยู่แล้ว
// This function adds two numbers
function add(a: number, b: number): number {
  return a + b;
}
```

#### 8.2 API Documentation

เมื่อเพิ่ม API endpoint ใหม่ ให้อัปเดต:
- `docs/API_DOCUMENTATION.md`
- Swagger/OpenAPI spec (ถ้ามี)

#### 8.3 README Updates

อัปเดต README.md เมื่อ:
- เพิ่ม features ใหญ่
- เปลี่ยน setup process
- เพิ่ม dependencies สำคัญ

---

### 9. Getting Help

#### 9.1 ช่องทางติดต่อ

- 💬 GitHub Issues - สำหรับ bug reports และ feature requests
- 📧 Email - [อีเมลของทีม]
- 💡 Discussions - สำหรับคำถามทั่วไป

#### 9.2 Resources

- [Setup Guide](./SETUP_GUIDE.md)
- [Architecture Documentation](./ARCHITECTURE.md)
- [API Documentation](./API_DOCUMENTATION.md)

---

## 🇬🇧 English

### 🎉 Welcome to HARI!

Thank you for your interest in contributing to the HARI project! This document will guide you through the contribution process.

---

### 📋 Table of Contents

1. [Code of Conduct](#1-code-of-conduct-1)
2. [Getting Started](#2-getting-started-1)
3. [Development Workflow](#3-development-workflow-1)
4. [Coding Standards](#4-coding-standards-1)
5. [Commit Guidelines](#5-commit-guidelines-1)
6. [Pull Request Process](#6-pull-request-process-1)
7. [Testing](#7-testing-1)
8. [Documentation](#8-documentation-1)

---

### 1. Code of Conduct

[Same content as Thai version with English descriptions]

---

### 2. Getting Started

[Same content as Thai version with English descriptions]

---

### 3. Development Workflow

[Same content as Thai version with English descriptions]

---

### 4. Coding Standards

[Same content as Thai version with English descriptions]

---

### 5. Commit Guidelines

[Same content as Thai version with English descriptions]

---

### 6. Pull Request Process

[Same content as Thai version with English descriptions]

---

### 7. Testing

[Same content as Thai version with English descriptions]

---

### 8. Documentation

[Same content as Thai version with English descriptions]

---

### 9. Getting Help

[Same content as Thai version with English descriptions]

---

## 🙏 Thank You!

Thank you for contributing to HARI! Every contribution, no matter how small, helps make this project better.

**Happy Coding! 💙**
