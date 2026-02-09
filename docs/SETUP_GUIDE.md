# HARI Setup Guide / คู่มือการติดตั้ง HARI

[🇹🇭 ภาษาไทย](#ภาษาไทย) | [🇬🇧 English](#english)

---

## 🇹🇭 ภาษาไทย

### 📋 สารบัญ

1. [ข้อกำหนดของระบบ](#1-ข้อกำหนดของระบบ)
2. [การติดตั้งพื้นฐาน](#2-การติดตั้งพื้นฐาน)
3. [การตั้งค่า Database](#3-การตั้งค่า-database)
4. [การตั้งค่า Environment Variables](#4-การตั้งค่า-environment-variables)
5. [การรันโปรเจค](#5-การรันโปรเจค)
6. [การแก้ปัญหา](#6-การแก้ปัญหา)
7. [การ Deploy](#7-การ-deploy)

---

### 1. ข้อกำหนดของระบบ

#### Software Requirements

- **Node.js**: v18.0.0 หรือสูงกว่า
- **npm**: v9.0.0 หรือสูงกว่า
- **PostgreSQL**: v14.0 หรือสูงกว่า
- **Git**: สำหรับ clone repository

#### Hardware Requirements (Minimum)

- **RAM**: 4GB
- **Storage**: 2GB ว่าง
- **CPU**: Dual-core processor

#### ตรวจสอบ Version

```bash
node --version    # ควรแสดง v18.x.x หรือสูงกว่า
npm --version     # ควรแสดง v9.x.x หรือสูงกว่า
git --version     # ควรแสดง git version 2.x.x
```

---

### 2. การติดตั้งพื้นฐาน

#### 2.1 Clone Repository

```bash
# Clone โปรเจค
git clone https://github.com/isola513i/hari-hr-system.git

# เข้าไปในโฟลเดอร์โปรเจค
cd hari-hr-system
```

#### 2.2 ติดตั้ง Dependencies

โปรเจคนี้ใช้ **npm workspaces** สำหรับจัดการ monorepo

```bash
# ติดตั้ง dependencies ทั้งหมด (root, api, web)
npm install
```

คำสั่งนี้จะติดตั้ง:
- Dependencies ของ root workspace
- Dependencies ของ `apps/api` (Backend)
- Dependencies ของ `apps/web` (Frontend)

#### 2.3 ตรวจสอบการติดตั้ง

```bash
# ตรวจสอบโครงสร้าง node_modules
ls -la node_modules/
ls -la apps/api/node_modules/
ls -la apps/web/node_modules/
```

---

### 3. การตั้งค่า Database

#### 3.1 Option 1: ใช้ Neon Database (แนะนำ)

[Neon](https://neon.tech) เป็น Serverless PostgreSQL ที่ใช้งานฟรีได้

**ขั้นตอน:**

1. ไปที่ https://neon.tech
2. สร้างบัญชีใหม่ (ฟรี)
3. สร้าง Project ใหม่
4. คัดลอก Connection String ที่ได้

**รูปแบบ Connection String:**
```
postgresql://[user]:[password]@[host]/[database]?sslmode=require
```

#### 3.2 Option 2: ใช้ PostgreSQL Local

**สำหรับ macOS (Homebrew):**
```bash
# ติดตั้ง PostgreSQL
brew install postgresql@14

# เริ่มต้น PostgreSQL
brew services start postgresql@14

# สร้าง Database
createdb hari_hr
```

**สำหรับ Ubuntu/Debian:**
```bash
# ติดตั้ง PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# เริ่มต้น Service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# สร้าง Database
sudo -u postgres createdb hari_hr
```

**สำหรับ Windows:**
1. ดาวน์โหลด PostgreSQL จาก https://www.postgresql.org/download/windows/
2. ติดตั้งตาม wizard
3. เปิด pgAdmin และสร้าง database ชื่อ `hari_hr`

**Connection String สำหรับ Local:**
```
postgresql://postgres:yourpassword@localhost:5432/hari_hr
```

---

### 4. การตั้งค่า Environment Variables

#### 4.1 Backend Environment Variables

สร้างไฟล์ `.env` ใน `apps/api/`:

```bash
cd apps/api
touch .env
```

**เนื้อหาในไฟล์ `apps/api/.env`:**
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_min_32_characters_change_in_production

# CORS
FRONTEND_URL=http://localhost:5173

# Optional: Session Timeout (minutes)
SESSION_TIMEOUT=30
```

**⚠️ สำคัญ:**
- `JWT_SECRET` ควรยาวอย่างน้อย 32 ตัวอักษร
- ใช้รหัสที่ซับซ้อนสำหรับ Production
- อย่า commit ไฟล์ `.env` เข้า Git

**สร้าง JWT_SECRET แบบสุ่ม:**
```bash
# macOS/Linux
openssl rand -base64 32

# หรือใช้ Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

#### 4.2 Frontend Environment Variables (Optional)

สร้างไฟล์ `.env.local` ใน `apps/web/`:

```bash
cd apps/web
touch .env.local
```

**เนื้อหาในไฟล์ `apps/web/.env.local`:**
```env
# API Base URL
VITE_API_URL=http://localhost:3001

# Optional: Enable Debug Mode
VITE_DEBUG=true
```

**หมายเหตุ:** Frontend จะใช้ `http://localhost:3001` เป็นค่า default ถ้าไม่ได้ตั้งค่า

---

### 5. การรันโปรเจค

#### 5.1 Option 1: รันทั้ง Frontend และ Backend พร้อมกัน (แนะนำ)

```bash
# จาก root directory
npm run dev
```

คำสั่งนี้จะ:
- รัน Backend API ที่ `http://localhost:3001`
- รัน Frontend ที่ `http://localhost:5173`
- แสดง logs ของทั้งสอง services พร้อมกัน

#### 5.2 Option 2: รันแยกกัน

**Terminal 1 - Backend:**
```bash
cd apps/api
npm run dev

# หรือจาก root:
npm run dev:api
```

**Terminal 2 - Frontend:**
```bash
cd apps/web
npm run dev

# หรือจาก root:
npm run dev:web
```

#### 5.3 ตรวจสอบว่ารันสำเร็จ

**Backend:**
- เปิด http://localhost:3001/ping
- ควรเห็น "pong"

**Frontend:**
- เปิด http://localhost:5173
- ควรเห็นหน้า Login

**API Documentation:**
- เปิด http://localhost:3001/api-docs
- ควรเห็น Swagger UI

---

### 6. การแก้ปัญหา

#### 6.1 ปัญหา: Port ถูกใช้งานอยู่แล้ว

**ข้อความ Error:**
```
Error: listen EADDRINUSE: address already in use :::3001
```

**วิธีแก้:**
```bash
# ค้นหา process ที่ใช้ port 3001
lsof -i :3001

# หรือใช้
netstat -vanp tcp | grep 3001

# Kill process
kill -9 <PID>

# หรือเปลี่ยน PORT ในไฟล์ .env
```

#### 6.2 ปัญหา: Database Connection Failed

**ข้อความ Error:**
```
Error: connect ECONNREFUSED localhost:5432
```

**วิธีแก้:**

1. ตรวจสอบว่า PostgreSQL กำลังรันอยู่:
```bash
# macOS
brew services list | grep postgresql

# Linux
sudo systemctl status postgresql
```

2. ตรวจสอบ `DATABASE_URL` ใน `.env`
3. ทดสอบ connection:
```bash
psql "$DATABASE_URL"
```

#### 6.3 ปัญหา: JWT Token Invalid

**ข้อความ Error:**
```
Error: invalid token
```

**วิธีแก้:**
1. ตรวจสอบว่า `JWT_SECRET` ตั้งค่าใน `.env`
2. Clear browser cookies/localStorage
3. Login ใหม่

#### 6.4 ปัญหา: Cannot find module

**วิธีแก้:**
```bash
# ลบ node_modules และ package-lock.json
rm -rf node_modules apps/*/node_modules
rm -f package-lock.json apps/*/package-lock.json

# ติดตั้งใหม่
npm install
```

#### 6.5 ปัญหา: CORS Error

**ข้อความ Error:**
```
Access to fetch at 'http://localhost:3001' has been blocked by CORS policy
```

**วิธีแก้:**
1. ตรวจสอบ `FRONTEND_URL` ใน `apps/api/.env`
2. ตรวจสอบว่า Frontend URL ถูกต้อง
3. Restart Backend server

---

### 7. การ Deploy

#### 7.1 Frontend (Vercel)

**ขั้นตอน:**

1. ไปที่ https://vercel.com
2. Import repository จาก GitHub
3. ตั้งค่า Build:
   - **Framework Preset**: Vite
   - **Root Directory**: `apps/web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. เพิ่ม Environment Variables:
   ```
   VITE_API_URL=https://your-backend-url.com
   ```

5. Deploy!

#### 7.2 Backend (Render)

**ขั้นตอน:**

1. ไปที่ https://render.com
2. สร้าง Web Service ใหม่
3. เชื่อมต่อ GitHub repository
4. ตั้งค่า:
   - **Root Directory**: `apps/api`
   - **Build Command**: `npm install && npm run build` (ถ้ามี)
   - **Start Command**: `npm start`

5. เพิ่ม Environment Variables:
   ```env
   NODE_ENV=production
   DATABASE_URL=your_production_database_url
   JWT_SECRET=your_secure_secret_key
   FRONTEND_URL=https://your-frontend-url.vercel.app
   ```

6. Deploy!

#### 7.3 Database (Neon)

Production database ควรใช้ Neon หรือ service อื่นที่รองรับ PostgreSQL:
- Neon (แนะนำ): https://neon.tech
- Supabase: https://supabase.com
- Railway: https://railway.app

---

### 8. Login Credentials

**Default Admin Account:**
```
Email: admin@company.com
Password: Admin123!@#
```

**Default Employee Account:**
```
Email: john.doe@company.com
Password: Employee123!@#
```

**⚠️ เปลี่ยนรหัสผ่านทันทีหลังติดตั้งในระบบ Production!**

---

### 9. ขั้นตอนถัดไป

หลังจากติดตั้งสำเร็จแล้ว:

1. ✅ เปลี่ยนรหัสผ่าน Admin
2. ✅ สร้างบัญชี HR Admin เพิ่ม
3. ✅ ทดสอบฟีเจอร์ต่างๆ
4. ✅ อ่านเอกสาร API Documentation
5. ✅ ตั้งค่า Backup สำหรับ Database
6. ✅ เพิ่ม Monitoring (ถ้าเป็น Production)

---

## 🇬🇧 English

### 📋 Table of Contents

1. [System Requirements](#1-system-requirements)
2. [Basic Installation](#2-basic-installation)
3. [Database Setup](#3-database-setup)
4. [Environment Variables Setup](#4-environment-variables-setup)
5. [Running the Project](#5-running-the-project)
6. [Troubleshooting](#6-troubleshooting)
7. [Deployment](#7-deployment)

---

### 1. System Requirements

#### Software Requirements

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **PostgreSQL**: v14.0 or higher
- **Git**: For cloning the repository

#### Hardware Requirements (Minimum)

- **RAM**: 4GB
- **Storage**: 2GB free space
- **CPU**: Dual-core processor

#### Check Versions

```bash
node --version    # Should show v18.x.x or higher
npm --version     # Should show v9.x.x or higher
git --version     # Should show git version 2.x.x
```

---

### 2. Basic Installation

#### 2.1 Clone Repository

```bash
# Clone the project
git clone https://github.com/isola513i/hari-hr-system.git

# Navigate to project folder
cd hari-hr-system
```

#### 2.2 Install Dependencies

This project uses **npm workspaces** for monorepo management

```bash
# Install all dependencies (root, api, web)
npm install
```

This command will install:
- Root workspace dependencies
- `apps/api` (Backend) dependencies
- `apps/web` (Frontend) dependencies

#### 2.3 Verify Installation

```bash
# Check node_modules structure
ls -la node_modules/
ls -la apps/api/node_modules/
ls -la apps/web/node_modules/
```

---

### 3. Database Setup

#### 3.1 Option 1: Using Neon Database (Recommended)

[Neon](https://neon.tech) is a Serverless PostgreSQL with a free tier

**Steps:**

1. Go to https://neon.tech
2. Create a new account (free)
3. Create a new Project
4. Copy the Connection String

**Connection String Format:**
```
postgresql://[user]:[password]@[host]/[database]?sslmode=require
```

#### 3.2 Option 2: Using Local PostgreSQL

**For macOS (Homebrew):**
```bash
# Install PostgreSQL
brew install postgresql@14

# Start PostgreSQL
brew services start postgresql@14

# Create Database
createdb hari_hr
```

**For Ubuntu/Debian:**
```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start Service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create Database
sudo -u postgres createdb hari_hr
```

**For Windows:**
1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Install using the wizard
3. Open pgAdmin and create a database named `hari_hr`

**Connection String for Local:**
```
postgresql://postgres:yourpassword@localhost:5432/hari_hr
```

---

### 4. Environment Variables Setup

#### 4.1 Backend Environment Variables

Create `.env` file in `apps/api/`:

```bash
cd apps/api
touch .env
```

**Content of `apps/api/.env`:**
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_min_32_characters_change_in_production

# CORS
FRONTEND_URL=http://localhost:5173

# Optional: Session Timeout (minutes)
SESSION_TIMEOUT=30
```

**⚠️ Important:**
- `JWT_SECRET` should be at least 32 characters
- Use complex secret for Production
- Never commit `.env` files to Git

**Generate Random JWT_SECRET:**
```bash
# macOS/Linux
openssl rand -base64 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

#### 4.2 Frontend Environment Variables (Optional)

Create `.env.local` file in `apps/web/`:

```bash
cd apps/web
touch .env.local
```

**Content of `apps/web/.env.local`:**
```env
# API Base URL
VITE_API_URL=http://localhost:3001

# Optional: Enable Debug Mode
VITE_DEBUG=true
```

**Note:** Frontend will use `http://localhost:3001` as default if not configured

---

### 5. Running the Project

#### 5.1 Option 1: Run Both Frontend and Backend Together (Recommended)

```bash
# From root directory
npm run dev
```

This command will:
- Run Backend API at `http://localhost:3001`
- Run Frontend at `http://localhost:5173`
- Show logs from both services simultaneously

#### 5.2 Option 2: Run Separately

**Terminal 1 - Backend:**
```bash
cd apps/api
npm run dev

# Or from root:
npm run dev:api
```

**Terminal 2 - Frontend:**
```bash
cd apps/web
npm run dev

# Or from root:
npm run dev:web
```

#### 5.3 Verify Successful Launch

**Backend:**
- Open http://localhost:3001/ping
- Should see "pong"

**Frontend:**
- Open http://localhost:5173
- Should see Login page

**API Documentation:**
- Open http://localhost:3001/api-docs
- Should see Swagger UI

---

### 6. Troubleshooting

#### 6.1 Issue: Port Already in Use

**Error Message:**
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solution:**
```bash
# Find process using port 3001
lsof -i :3001

# Or use
netstat -vanp tcp | grep 3001

# Kill process
kill -9 <PID>

# Or change PORT in .env file
```

#### 6.2 Issue: Database Connection Failed

**Error Message:**
```
Error: connect ECONNREFUSED localhost:5432
```

**Solution:**

1. Check if PostgreSQL is running:
```bash
# macOS
brew services list | grep postgresql

# Linux
sudo systemctl status postgresql
```

2. Verify `DATABASE_URL` in `.env`
3. Test connection:
```bash
psql "$DATABASE_URL"
```

#### 6.3 Issue: JWT Token Invalid

**Error Message:**
```
Error: invalid token
```

**Solution:**
1. Verify `JWT_SECRET` is set in `.env`
2. Clear browser cookies/localStorage
3. Login again

#### 6.4 Issue: Cannot Find Module

**Solution:**
```bash
# Remove node_modules and package-lock.json
rm -rf node_modules apps/*/node_modules
rm -f package-lock.json apps/*/package-lock.json

# Reinstall
npm install
```

#### 6.5 Issue: CORS Error

**Error Message:**
```
Access to fetch at 'http://localhost:3001' has been blocked by CORS policy
```

**Solution:**
1. Check `FRONTEND_URL` in `apps/api/.env`
2. Verify Frontend URL is correct
3. Restart Backend server

---

### 7. Deployment

#### 7.1 Frontend (Vercel)

**Steps:**

1. Go to https://vercel.com
2. Import repository from GitHub
3. Configure Build:
   - **Framework Preset**: Vite
   - **Root Directory**: `apps/web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. Add Environment Variables:
   ```
   VITE_API_URL=https://your-backend-url.com
   ```

5. Deploy!

#### 7.2 Backend (Render)

**Steps:**

1. Go to https://render.com
2. Create a new Web Service
3. Connect GitHub repository
4. Configure:
   - **Root Directory**: `apps/api`
   - **Build Command**: `npm install && npm run build` (if applicable)
   - **Start Command**: `npm start`

5. Add Environment Variables:
   ```env
   NODE_ENV=production
   DATABASE_URL=your_production_database_url
   JWT_SECRET=your_secure_secret_key
   FRONTEND_URL=https://your-frontend-url.vercel.app
   ```

6. Deploy!

#### 7.3 Database (Neon)

Production database should use Neon or other PostgreSQL services:
- Neon (Recommended): https://neon.tech
- Supabase: https://supabase.com
- Railway: https://railway.app

---

### 8. Login Credentials

**Default Admin Account:**
```
Email: admin@company.com
Password: Admin123!@#
```

**Default Employee Account:**
```
Email: john.doe@company.com
Password: Employee123!@#
```

**⚠️ Change passwords immediately after installation in Production!**

---

### 9. Next Steps

After successful installation:

1. ✅ Change Admin password
2. ✅ Create additional HR Admin accounts
3. ✅ Test all features
4. ✅ Read API Documentation
5. ✅ Setup Database backup
6. ✅ Add Monitoring (for Production)

---

**Need Help?** Check our [troubleshooting section](#6-troubleshooting) or open an issue on GitHub.
