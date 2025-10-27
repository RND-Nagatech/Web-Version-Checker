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


## PWA (Progressive Web App) Support

Frontend sudah mendukung PWA (Progressive Web App):

- **Installable**: Bisa diinstall ke home screen (Android/iOS) atau desktop (Chrome/Edge)
- **Offline Support**: Aplikasi tetap bisa dibuka & digunakan saat offline (refresh tetap tampil, tidak blank)
- **Service Worker**: Otomatis cache file hasil build (JS, CSS, icon, dll) agar offline-refresh tetap berjalan
- **Update Otomatis**: Jika ada versi baru, user akan mendapat notifikasi update

### Cara Build & Test PWA Offline

1. **Build Production**
	```bash
	cd client
	npm run build
	```
2. **Serve hasil build**
	```bash
	npx serve dist
	```
	atau gunakan server statis lain
3. **Akses aplikasi**
	Buka di browser: `http://localhost:3000` (atau port sesuai output serve)
4. **Install ke Home Screen/Desktop**
	- Klik icon install di address bar (Chrome/Edge) atau menu browser
5. **Test Offline**
	- Matikan koneksi internet
	- Refresh aplikasi: tampilan tetap muncul, status berubah jadi "Offline"

### Catatan Service Worker
- Service worker akan otomatis cache semua file penting hasil build (`/assets/`, `index.html`, dll)
- Jika ada perubahan pada file service worker, lakukan hard refresh (Ctrl+Shift+R) atau clear cache agar update diterapkan
- Untuk development (`npm run dev`), offline support tidak aktif penuh (karena Vite dev server tidak menghasilkan file statis)

---

## Production Deployment

Untuk production, update environment variables:
- Set `VITE_API_BASE_URL` ke backend yang sudah dideploy
- Atur port server dan konfigurasi lain sesuai kebutuhan

## Notes
- Puppeteer akan download Chromium saat `npm install`.
- Untuk deploy production, gunakan host yang support headless Chromium (Render, Fly.io, VPS).
- Frontend sudah mendukung Light/Dark mode (disimpan di localStorage).
- File environment (.env) di-ignore oleh git demi keamanan.
