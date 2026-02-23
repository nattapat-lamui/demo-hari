# HARI HR System v1.1

<div align="center">

![HARI HR System](https://img.shields.io/badge/HARI-HR%20System-blue?style=for-the-badge)
![Version](https://img.shields.io/badge/version-1.1-green?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-orange?style=for-the-badge)

**A Modern, Enterprise-Grade HR Management Platform**

Built with React 19, TypeScript, Express.js, PostgreSQL, and Socket.io

[Features](#-features) | [Getting Started](#-getting-started) | [Tech Stack](#-tech-stack) | [Architecture](#-system-architecture) | [API Docs](#-api-endpoints)

</div>

---

## Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Getting Started](#-getting-started)
- [API Endpoints](#-api-endpoints)
- [Security](#-security)
- [Performance](#-performance)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Roadmap](#-roadmap)
- [License](#-license)

---

## Overview

HARI (Human Affairs & Resource Integration) is a comprehensive HR management system designed to streamline employee management, attendance tracking, leave management, onboarding, document management, surveys, and compliance monitoring.

**Key Highlights:**
- Beautiful, responsive UI with dark mode support
- Enterprise-grade security (JWT, session management, audit logging)
- Real-time updates via Socket.io
- Server-side caching and React Query for optimal data fetching
- Fully responsive design (Mobile, Tablet, Desktop)
- Interactive dashboards, org charts, and analytics
- ISO 45003 psychosocial wellbeing surveys

---

## Features

### Employee Management
- **Employee Directory** with search, filter, and pagination
- **Employee Profiles** with job history, performance reviews, training records, skills, and documents
- **Employee Actions**: Promote, Transfer, Terminate with automatic job history tracking
- **Interactive Org Chart** with drill-down hierarchy
- **Profile Avatars** with upload, fallback initials, and automatic URL normalization

### Attendance System
- **Clock In / Clock Out** with real-time status
- **Auto-Checkout** at end of day via scheduled cron jobs
- **Auto-Absent** marking for no-shows
- **Overtime & Early Departure** detection
- **Admin Attendance Management** with manual override
- **Timezone-aware** records (UTC storage, local display)

### Leave Management
- **Leave Request Workflow**: Submit, approve/reject with rejection reasons
- **Leave Types**: Annual, Sick, Personal, Leave Without Pay
- **Medical Certificate Upload** for sick leave
- **Leave Balance Tracking** with real-time calculation
- **Leave Calendar** with visual date range display
- **Leave History** with full audit trail

### Document Management
- **Secure File Storage**: Upload and manage HR documents (policies, contracts, forms)
- **Role-based Access Control** for document permissions
- **Grid/List Views** with file type icons
- **In-browser Preview** and download
- **50MB upload limit** with type validation

### Onboarding
- **Digital Checklists**: Automated onboarding task management
- **Document Collection**: Gather required documents from new hires
- **Task Assignment**: Assign tasks to HR, managers, and employees
- **Progress Tracking**: Real-time onboarding completion monitoring
- **Admin Overview**: Dashboard for all active onboarding processes

### Surveys & Sentiment
- **ISO 45003 Psychosocial Wellbeing Survey**: Seed survey with 25 questions across 5 categories (Workload, Team, Growth, Work-Life Balance, Management)
- **Anonymous Responses** with Likert scale (1-5)
- **Sentiment Analytics**: Department-wise and category-wise breakdown
- **Survey Management**: Create, activate, close surveys (Admin)

### Analytics & Dashboards
- **HR Admin Dashboard**: Headcount, department distribution, leave trends, attendance stats
- **Employee Dashboard**: Personal attendance, leave balance, upcoming events
- **Interactive Charts**: Bar, line, pie, and area charts via Recharts
- **Team Hierarchy View**: My-team view with direct reports

### Real-time Notifications
- **Socket.io Integration** for live updates
- **Leave Request Notifications**: Instant alerts on submit/approve/reject
- **Query Sync Bridge**: Automatic React Query cache invalidation on socket events

### Settings & Configuration
- **Profile Management**: Update name, email, phone, bio, avatar
- **Theme Customization**: Light / Dark / System mode
- **Language Selection**: English / Thai
- **Notification Preferences**: Email, push, Slack toggles
- **Password Management**: Change password with strength validation
- **System Config**: Admin-configurable default password for new employees

### Compliance & Audit
- **Comprehensive Audit Logging**: Tracks login, logout, password changes, CRUD operations
- **IP & User Agent Capture** for security monitoring
- **Sensitive Data Sanitization**: Passwords redacted in logs
- **Real-time Log Viewing** in Compliance page

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19.2 | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 6.x | Build tool & dev server |
| TailwindCSS | 3.4 | Utility-first styling |
| TanStack React Query | 5.x | Server state management & caching |
| React Router | 7.x | Client-side routing |
| Socket.io Client | 4.8 | Real-time communication |
| Recharts | 3.4 | Data visualization |
| Lucide React | 0.554 | Icon library |
| Day.js | 1.11 | Date manipulation |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js + Express | 4.19 | HTTP server & routing |
| TypeScript | 5.x | Type safety |
| PostgreSQL (Neon) | - | Database |
| pg | 8.11 | PostgreSQL client |
| Socket.io | 4.8 | Real-time WebSocket server |
| JWT (jsonwebtoken) | 9.x | Authentication tokens |
| bcrypt | 6.x | Password hashing |
| Multer | 2.x | File uploads |
| Helmet | 8.x | HTTP security headers |
| express-rate-limit | - | Rate limiting |
| express-validator | 7.x | Input validation |
| node-cron | 4.x | Scheduled tasks (attendance) |
| Swagger (jsdoc + UI) | 6.x / 5.x | API documentation |
| Nodemailer | 8.x | Email notifications |

### Shared
| Package | Purpose |
|---|---|
| `@hari/shared-types` | Shared TypeScript interfaces (employee, leave, auth, dashboard, etc.) |

---

## System Architecture

### Monorepo Structure
```
HARI-V1.1/
├── apps/
│   ├── web/                    # Frontend (React + Vite)
│   │   ├── components/
│   │   │   ├── ui/             # Reusable UI (Avatar, Modal, Pagination, Toast, etc.)
│   │   │   ├── layout/         # Layout shells (Header, Sidebar, Breadcrumbs, etc.)
│   │   │   ├── dashboard/      # Dashboard-specific components
│   │   │   ├── onboarding/     # Onboarding-specific components
│   │   │   └── employee-detail/# Employee detail sub-components
│   │   ├── features/
│   │   │   └── employees/      # Feature module (EmployeeList, AddEmployeeModal, etc.)
│   │   ├── pages/              # Route pages (27 pages)
│   │   ├── contexts/           # React Contexts (Auth, Leave, Notification)
│   │   ├── hooks/              # Custom hooks (queries.ts, useSocketQuerySync, etc.)
│   │   ├── lib/                # API client, query keys, query client config
│   │   ├── services/           # Error logging
│   │   └── types.ts            # Frontend type definitions
│   │
│   └── api/                    # Backend (Express + TypeScript)
│       ├── src/
│       │   ├── routes/         # Route definitions (20 route files)
│       │   ├── controllers/    # Request handlers
│       │   ├── services/       # Business logic
│       │   ├── modules/
│       │   │   └── employees/  # Feature module (controller, service, routes)
│       │   ├── middlewares/    # Auth, security, cache, audit
│       │   ├── models/         # TypeScript interfaces & DTOs
│       │   ├── scripts/        # DB initialization & seed data
│       │   ├── config/         # Swagger, Sentry config
│       │   ├── socket.ts       # Socket.io event handlers
│       │   ├── db.ts           # PostgreSQL connection pool
│       │   └── index.ts        # App entry point, middleware, migrations
│       └── uploads/            # File storage (avatars, documents, medical certs)
│
├── packages/
│   └── shared-types/           # @hari/shared-types (cross-app TypeScript interfaces)
│       └── src/                # auth, employee, leave, dashboard, etc.
│
└── package.json                # Workspace root config
```

### Data Flow
```
Browser (React)
    ↕ HTTP/REST (fetch via lib/api.ts)
    ↕ WebSocket (Socket.io for real-time)
Express API (localhost:3001)
    ↕ SQL (pg pool)
PostgreSQL (Neon cloud)
```

### State Management
- **Server State**: TanStack React Query v5 — all API data fetching, caching, and invalidation
- **Auth State**: React Context (`AuthContext`) — user session, login/logout
- **Leave State**: React Context (`LeaveContext`) — leave balance, request management
- **Notification State**: React Context (`NotificationContext`) — in-app notifications
- **Real-time Sync**: Socket.io events bridge to React Query cache via `useSocketQuerySync`

---

## Getting Started

### Prerequisites
- **Node.js** v18+
- **npm** v8+
- **PostgreSQL** database (Neon DB recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/isola513i/hari-hr-system.git
   cd hari-hr-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup Environment Variables**

   **Backend** (`apps/api/.env`):
   ```env
   PORT=3001
   DATABASE_URL=postgresql://user:password@host/database?sslmode=require
   JWT_SECRET=your_super_secret_jwt_key
   JWT_REFRESH_SECRET=your_refresh_secret_key
   FRONTEND_URL=http://localhost:5173
   ```

   **Frontend** (`apps/web/.env.local`) — optional for local dev:
   ```env
   VITE_API_URL=http://localhost:3001/api
   ```
   > If omitted, the Vite dev server proxies `/api` and `/uploads` to `localhost:3001` automatically.

4. **Database Setup**
   - Create a PostgreSQL database on [Neon](https://neon.tech) or locally
   - Copy the connection string to `DATABASE_URL`
   - Navigate to `http://localhost:3001/api/setup` to initialize tables and seed data

### Running the Application

**Concurrent (recommended):**
```bash
npm run dev
# Frontend: http://localhost:5173
# Backend:  http://localhost:3001
# API Docs: http://localhost:3001/api-docs
```

**Separate terminals:**
```bash
npm run dev:api   # Terminal 1 — Backend on :3001
npm run dev:web   # Terminal 2 — Frontend on :5173
```

### Default Credentials
After running `/api/setup`, use the admin account created by the seed data to log in.

---

## API Endpoints

Base URL: `http://localhost:3001/api`

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/login` | Login (returns JWT + refresh token) |
| POST | `/auth/refresh-token` | Refresh access token |
| POST | `/auth/logout` | Revoke refresh token |
| POST | `/auth/change-password` | Change password |

### Employees
| Method | Endpoint | Description |
|---|---|---|
| GET | `/employees` | List all employees |
| GET | `/employees/:id` | Get employee by ID |
| GET | `/employees/:id/manager` | Get employee's manager |
| GET | `/employees/:id/direct-reports` | Get direct reports |
| POST | `/employees` | Create employee (Admin) |
| POST | `/employees/upload-avatar` | Upload avatar image |
| PATCH | `/employees/:id` | Update employee |
| DELETE | `/employees/:id` | Delete employee (Admin) |

### Leave Requests
| Method | Endpoint | Description |
|---|---|---|
| GET | `/leave-requests` | List all leave requests |
| POST | `/leave-requests` | Create leave request (with medical cert upload) |
| PUT | `/leave-requests/:id` | Approve/Reject (Admin) |
| DELETE | `/leave-requests/:id` | Delete request |

### Attendance
| Method | Endpoint | Description |
|---|---|---|
| GET | `/attendance` | Get own attendance records |
| POST | `/attendance/clock-in` | Clock in |
| POST | `/attendance/clock-out` | Clock out |
| GET | `/admin/attendance` | All attendance records (Admin) |
| PATCH | `/admin/attendance/:id` | Override attendance (Admin) |

### Documents
| Method | Endpoint | Description |
|---|---|---|
| GET | `/documents` | List documents |
| POST | `/documents` | Upload document |
| GET | `/documents/:id/download` | Download file |
| DELETE | `/documents/:id` | Delete document |

### Surveys
| Method | Endpoint | Description |
|---|---|---|
| GET | `/surveys` | List all surveys |
| GET | `/surveys/:id` | Get survey with questions |
| POST | `/surveys` | Create survey (Admin) |
| POST | `/surveys/:id/responses` | Submit survey response |
| GET | `/surveys/:id/results` | Get survey results (Admin) |

### Other Endpoints
| Resource | Endpoints |
|---|---|
| **Dashboard** | `GET /dashboard/stats`, `GET /dashboard/my-team-hierarchy` |
| **Org Chart** | `GET /org-chart` |
| **Job History** | `GET /job-history/:employeeId`, `POST /job-history` |
| **Training** | `GET /training/:employeeId`, `POST /training` |
| **Performance** | `GET /performance/:employeeId`, `POST /performance` |
| **Onboarding** | `GET /onboarding`, `POST /onboarding`, `PATCH /onboarding/:id/tasks/:taskId` |
| **Announcements** | `GET /announcements`, `POST /announcements` |
| **Events** | `GET /events`, `POST /events` |
| **Notifications** | `GET /notifications`, `PATCH /notifications/:id/read` |
| **Analytics** | `GET /analytics/headcount`, `GET /analytics/leave-trends` |
| **Audit Logs** | `GET /audit-logs` (Admin) |
| **Payroll** | `GET /payroll`, `POST /payroll` |

Full Swagger documentation available at `/api-docs` when the server is running.

---

## Security

### Authentication & Authorization
- **JWT Authentication** with access + refresh token rotation
- **Password Strength Validation**: 8+ chars, uppercase, lowercase, numbers, special characters
- **Session Management**: Auto-logout after 30 min inactivity with 5-min warning countdown
- **Role-Based Access Control (RBAC)**: HR Admin vs Employee permissions
- **Refresh Token Revocation** on logout

### Data Security
- **Rate Limiting**: General (5000/15min), Auth (5/15min), API (30/min)
- **Input Validation & Sanitization**: express-validator with XSS protection
- **Security Headers**: Helmet.js
- **CORS Configuration**: Configurable allowed origins
- **Password Hashing**: bcrypt with salt rounds
- **File Upload Validation**: Type whitelist + size limits

### Audit & Compliance
- **Comprehensive Audit Logging**: Login, logout, password changes, CRUD operations
- **Captures**: Timestamp, user, action, resource, IP, user agent
- **Sensitive Data Sanitization**: Passwords redacted in logs
- **Real-time Log Viewing** in Compliance page

---

## Performance

### Code Splitting
- **Route-based Lazy Loading**: React.lazy() for all pages
- **Vendor Chunk Splitting**: react-vendor (48KB gz), chart-vendor (115KB gz), ui-vendor (8KB gz)
- **Initial Bundle**: ~66KB gzipped (down from 240KB — 72% reduction)

### Caching
- **React Query**: Automatic caching, background refetching, stale-while-revalidate
- **Server-side Cache**: In-memory response cache with configurable TTL (1min–1hr)
- **Cache Invalidation**: Automatic on mutations + Socket.io events

### Asset Optimization
- **Image Lazy Loading**: LazyImage component with Intersection Observer
- **esbuild Minification**: Fast production builds
- **Content Hashing**: Long-term cache busting

---

## Responsive Design

- **Dashboard**: 1-col mobile, 2-col tablet, 4-col desktop
- **Employee Directory**: Card view (mobile) / Table view (desktop)
- **Documents**: Card view (mobile) / Grid+Table view (desktop)
- **Leave Requests**: Card view (mobile) / Table view (desktop)
- **Navigation**: Slide-out drawer (mobile) / Persistent sidebar (desktop)

Breakpoints: `sm` 640px | `md` 768px | `lg` 1024px | `xl` 1280px | `2xl` 1536px

---

## Testing

### Backend Unit Tests (Jest)
```bash
npm run test:api
```

### End-to-End Tests (Playwright)
```bash
npm run test:e2e
npx playwright test --ui    # Interactive mode
npx playwright show-report  # View report
```

---

## Deployment

### Frontend (Vercel / Netlify)
```bash
cd apps/web && npm run build
# Deploy the dist/ folder
# Set VITE_API_URL to your production API
```

### Backend (Railway / Render)
```bash
cd apps/api && npm start
# Set environment variables: DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, FRONTEND_URL
```

### Production Environment Variables
```env
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=<secure-random-string>
JWT_REFRESH_SECRET=<secure-random-string>
FRONTEND_URL=https://your-frontend.com
```

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Run frontend + backend concurrently |
| `npm run dev:web` | Frontend only |
| `npm run dev:api` | Backend only |
| `npm run build:web` | Build frontend for production |
| `npm run test:api` | Run backend unit tests |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run lint` | Lint all workspaces |
| `npm run format` | Format code with Prettier |

---

## Roadmap

### Completed
- [x] Employee CRUD with search, filter, pagination
- [x] Interactive Org Chart
- [x] Leave management with approval workflow
- [x] Document management with upload/download
- [x] Onboarding checklist system
- [x] Attendance (clock in/out, auto-checkout, auto-absent)
- [x] ISO 45003 psychosocial wellbeing surveys
- [x] Real-time notifications via Socket.io
- [x] Dark mode / theme system
- [x] React Query migration (from custom cache)
- [x] Shared types package (`@hari/shared-types`)
- [x] Swagger API documentation
- [x] Audit logging & compliance

### Upcoming
- [ ] Two-Factor Authentication (2FA) — TOTP implementation
- [ ] Email notifications via SMTP
- [ ] Advanced analytics & predictive insights
- [ ] Mobile app (React Native)
- [ ] Payroll integration
- [ ] 360-degree performance reviews
- [ ] Multi-language (i18n) support
- [ ] Slack / Teams bot integration
- [ ] Calendar sync (Google / Outlook)

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## Author

**AiYa Internship Team**
- Repository: [github.com/isola513i/hari-hr-system](https://github.com/isola513i/hari-hr-system)

### Acknowledgments
- Powered by Neon PostgreSQL
- UI inspired by shadcn/ui
- Icons by Lucide React
- Co-developed with Claude Code (Opus 4.6)

---

<div align="center">

**Made with care by AiYa Internship Team**

[Back to Top](#hari-hr-system-v11)

</div>
