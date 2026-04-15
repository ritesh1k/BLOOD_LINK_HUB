# Vercel Deployment Guide - Blood Donation Platform

This document explains how to deploy your Blood Donation Platform backend to Vercel as a serverless function.

## Quick Setup

### 1. Prerequisites
- Vercel account (sign up at https://vercel.com)
- GitHub account with your repository (already done)
- Git installed locally

### 2. Deploy to Vercel

**Option A: Using Vercel CLI (Recommended)**

```bash
# Install Vercel CLI globally
npm install -g vercel

# Navigate to your project directory
cd d:\blood_fullstack_upgraded

# Deploy
vercel

# Follow prompts and confirm
```

**Option B: Using GitHub Integration (Easiest)**

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your GitHub repository: `ritesh1k/BLOOD_LINK_HUB`
4. Click "Import"
5. Vercel will automatically detect the configuration
6. Click "Deploy"

### 3. Configure Environment Variables (in Vercel Dashboard)

1. Go to your Vercel project dashboard
2. Navigate to **Settings > Environment Variables**
3. Add these variables:

```
NODE_ENV = production
CORS_ORIGIN = https://your-frontend-domain.com
```

### 4. Verify Deployment

After deployment, test these endpoints:

**Health Check:**
```
GET https://your-project.vercel.app/health
```

**Root Endpoint:**
```
GET https://your-project.vercel.app/
```

**List All Donors:**
```
GET https://your-project.vercel.app/api/donors
```

**Get Available Donors:**
```
GET https://your-project.vercel.app/api/donors/available?blood_group=O%2B
```

**Get Donor by ID:**
```
GET https://your-project.vercel.app/api/donors/1
```

**Search Donors (POST):**
```
POST https://your-project.vercel.app/api/donors/search
Content-Type: application/json

{
  "blood_group": "A+",
  "state": "Maharashtra",
  "district": "Mumbai"
}
```

**List Students:**
```
GET https://your-project.vercel.app/api/students
```

---

## Project Structure

```
blood_fullstack_upgraded/
├── api/
│   └── index.js              # Vercel serverless entry point (THIS IS USED)
├── backend/                  # Original Express backend (kept for reference)
│   ├── server.js            # Original server (NOT used in Vercel)
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   └── package.json
├── frontend/                 # Frontend files (separate deployment)
│   └── index.html
├── database/
│   └── schema.sql
├── vercel.json              # Vercel configuration
├── .env.example             # Environment variables template
├── package.json             # Root package.json (dependencies)
└── .gitignore
```

---

## How It Works

### Serverless Architecture

- **Entry Point**: `/api/index.js` is the serverless function handler
- **No `app.listen()`**: Vercel manages the server automatically
- **Database**: Mocked responses (no persistent database connection)
- **ES Modules**: Uses `import/export` syntax

### Key Changes from Original Backend

| Original | Serverless |
|----------|-----------|
| `app.listen(PORT)` | Removed (Vercel handles it) |
| MySQL database queries | Mocked with static JSON data |
| Running server | Stateless function execution |
| Long-lived connections | 10-second execution limit |

### Mock Data

The API returns mock data for these endpoints:
- **Donors**: 4 sample donors with blood types (O+, A+, B+, AB+)
- **Students**: 3 sample student records

To use real data later:
1. Set up a dedicated database service (e.g., Supabase, PlanetScale, Railway)
2. Replace mock data logic with actual queries
3. Update environment variables with database credentials

---

## Development vs. Production

### Local Development (if needed)
```bash
cd backend
npm install
npm start  # Uses server.js with database
```

### Vercel Production
```bash
# Automatic deployment on git push
git add .
git commit -m "Changes"
git push origin main

# Vercel will automatically rebuild and deploy
```

---

## Environment Variables Explained

```env
# Essential
NODE_ENV=production              # Always "production" on Vercel
CORS_ORIGIN=https://frontend.com # Your frontend URL for CORS

# Optional (kept for compatibility)
JWT_SECRET=change-me             # JWT signing key
JWT_EXPIRES=7d                   # Token expiration
```

---

## Troubleshooting

### Issue: "Cannot find module 'express'"
**Solution**: Ensure dependencies are in `package.json` and run:
```bash
cd backend
npm install
```

### Issue: "Database connection timeout"
**Solution**: This is expected! Vercel uses mock data. No database needed.

### Issue: "CORS errors in frontend"
**Solution**: Add your frontend domain to Vercel environment variables:
```
CORS_ORIGIN=https://your-frontend-domain.com
```

### Issue: "Function timed out after 10 seconds"
**Solution**: Vercel has a 10-second execution limit. Mock responses are instant, so this shouldn't happen.

---

## Production Checklist

- ✅ Code deployed to GitHub
- ✅ Vercel project created
- ✅ Environment variables configured
- ✅ Health check endpoint working
- ✅ CORS configured for frontend domain
- ✅ API returning mock data successfully
- ⏳ (Optional) Set up real database for production

---

## Frontend Configuration

**Connect your frontend to the API:**

```javascript
// In your frontend JavaScript
const API_URL = 'https://your-project.vercel.app';

// Example API call
fetch(`${API_URL}/api/donors`)
  .then(res => res.json())
  .then(data => console.log(data));
```

---

## Deployment Status

- **Backend**: Deployed on Vercel (serverless)
- **Frontend**: Ready for deployment (upload to Vercel or GitHub Pages)
- **Database**: Mocked (ready for future integration)

---

## Next Steps

1. **Test the API**: Use the endpoints listed in "Verify Deployment"
2. **Deploy Frontend**: Upload frontend/ to Vercel or GitHub Pages
3. **Integrate**: Update frontend API URLs to point to your Vercel backend
4. **Add Database** (Optional): For production, integrate a real database service

---

## Support

For issues with Vercel deployment:
- Check Vercel logs: Go to Vercel dashboard > Deployments > Logs
- Check this guide's Troubleshooting section
- Verify environment variables are set correctly

---

**Happy Deploying! 🚀**
