# Environment Variables Setup Guide

## 🔒 Security Notice

**NEVER commit `.env` files to git!** These files contain sensitive information like database passwords, API keys, and secrets.

## Setup Instructions

### 1. Backend (API)

Copy the example file and fill in your values:

```bash
cp apps/api/.env.example apps/api/.env
```

Then edit `apps/api/.env` with your actual values:

```env
PORT=3001
DATABASE_URL=postgresql://username:password@host/database?sslmode=require
```

### 2. Frontend (Web)

Copy the example file and fill in your values:

```bash
cp apps/web/.env.example apps/web/.env.local
```

Then edit `apps/web/.env.local` with your actual values:

```env
VITE_API_URL=http://localhost:3001/api
GEMINI_API_KEY=your_actual_api_key_here
```

## 🛡️ Security Measures in Place

### 1. `.gitignore` Protection
All `.env*` files (except `.env.example`) are ignored by git.

### 2. Pre-commit Hook
A pre-commit hook automatically blocks any attempt to commit `.env` files.

### 3. Example Files Only
Only `.env.example` files are committed to the repository as templates.

## ⚠️ If You Accidentally Commit .env

If you accidentally commit a `.env` file:

1. **DO NOT push** to remote if you haven't yet
2. Remove from staging: `git reset HEAD .env`
3. If already committed locally:
   ```bash
   git reset --soft HEAD~1  # Undo last commit
   git reset HEAD .env      # Unstage .env
   git commit -c ORIG_HEAD  # Recommit without .env
   ```
4. **If already pushed**: Contact the team lead immediately and rotate all secrets

## 📝 Required Environment Variables

### Backend (`apps/api/.env`)
- `PORT` - API server port (default: 3001)
- `DATABASE_URL` - PostgreSQL connection string

### Frontend (`apps/web/.env.local`)
- `VITE_API_URL` - API endpoint URL
- `GEMINI_API_KEY` - (Optional) Gemini AI API key

## 🔄 Updating Environment Variables

When adding new environment variables:

1. Update the appropriate `.env.example` file
2. Notify team members to update their local `.env` files
3. Update this documentation
4. **NEVER** commit actual values

## ✅ Testing the Pre-commit Hook

Try committing a `.env` file to test the protection:

```bash
git add apps/api/.env
git commit -m "test"
```

You should see an error message preventing the commit. ✅
