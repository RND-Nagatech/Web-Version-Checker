# Puppeteer Checker - Modern Dashboard (React + TypeScript + Tailwind)

This project contains a modern frontend (React + TypeScript + Tailwind) and a backend (Express + Puppeteer).

## Environment Setup

### Server (.env)
Create `server/.env`:
```env
# Server Configuration
PORT=5000

# Puppeteer Configuration
PUPPETEER_HEADLESS=true
PUPPETEER_ARGS=--no-sandbox,--disable-setuid-sandbox

# Timeout Configuration
NAVIGATION_TIMEOUT=90000
WAIT_TIMEOUT=30000
DELAY_MS=2000

# Concurrency Configuration
CHECK_CONCURRENCY=10
```

### Client (.env)
Create `client/.env`:
```env
# API Configuration
VITE_API_BASE_URL=http://localhost:5000

# Development Configuration
VITE_APP_TITLE=Puppeteer Checker
VITE_APP_VERSION=1.0.0
```

## Quick start (local)

### 1) Server
```bash
cd server
npm install
npm start
```
Server will run at http://localhost:5000

### 2) Client
```bash
cd client
npm install
npm run dev
```
Open http://localhost:5173 (Vite dev)

## Production Deployment

For production, update the environment variables:
- Set `VITE_API_BASE_URL` to your deployed backend URL
- Configure server port and other settings as needed

## Notes
- Puppeteer will download Chromium on `npm install`.
- For production deploy, choose host that supports headless Chromium (Render, Fly.io, VPS).
- The frontend includes a Light/Dark toggle saved in localStorage.
- Environment files (.env) are ignored by git for security.
