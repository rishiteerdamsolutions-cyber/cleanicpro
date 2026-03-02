# DPV - Doctor Prescription Voice

Monorepo containing:
1. **Admin Panel** - Central license management (port 3001)
2. **DPV App** - Offline-first prescription PWA (port 3000)

## Quick Start

### 1. Admin Panel Setup

```bash
cd apps/admin-panel
cp .env.example .env.local
```

- Set `MONGODB_URI` (e.g. `mongodb://localhost:27017/dpv-admin`)
- Generate RSA keys: `node scripts/generate-keys.js` and add to `.env.local`
- Seed admin: `curl -X POST http://localhost:3001/api/seed -H "Content-Type: application/json" -d '{"email":"admin@example.com","password":"yourpassword"}'`
- Start: `npm run dev`

### 2. DPV App Setup

```bash
cd apps/dpv-app
cp .env.example .env.local
```

- Set `NEXT_PUBLIC_ACTIVATION_API_URL` to your Admin Panel URL (e.g. `http://localhost:3001`)
- Start: `npm run dev`

### 3. Activation Flow

1. Create a hospital license in Admin Panel
2. Open DPV App, enter license key
3. App activates (requires internet once)
4. Use app fully offline

## Features

- **Admin Panel**: Super admin auth, create licenses, WhatsApp share, device management, activation API
- **DPV App**: License activation, doctor PIN login, voice input (en-IN), prescriptions, medicines/diseases, WiFi print (browser print), Excel export, backup/restore
