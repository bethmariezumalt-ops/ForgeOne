# Acme Fleet - Project State Notes

## Logo URLs (uploaded to webdev storage)
- Badge logo (sidebar/header): `/manus-storage/acme-badge-logo_d4967acd.png`
- Roadrunner mascot logo (invoices): `/manus-storage/acme-roadrunner-logo_ae2baad8.png`

## Business Lines:
- Acme Automotive (fleet vehicle maintenance through Holman)
- Customized Enterprise (flipping: furniture, vehicles, houses)
- On-Site Advantage (building maintenance, plumbing, signs)

## Key Architecture:
- tRPC + React 19 + Tailwind 4 + Express 4
- Database: MySQL via Drizzle ORM
- Auth: Manus OAuth with roles: user, admin, technician
- File storage: S3 via storagePut/storageGet in server/storage.ts
- QR codes: qrcode npm package, server-side generation

## Current User
- Beth Marie Zumalt (admin, bethmariezumalt@gmail.com)

## Features Completed:
- QR code scanning by VIN
- Work orders with comprehensive service categories
- Invoice generation with logos (print/email)
- Parts/inventory tracking
- Profitability reporting
- Calendar scheduling
- Driving logs
- Flip project tracking
- Time & Billing (actual vs billed hours)
- Client profitability overview with bids
- Handwritten invoice scanner (AI-powered)
- Photo uploads on work orders and bids (backend)
- Role-based dashboards (admin, technician, subcontractor)
- Multiple business line support
- Logos integrated into sidebar, login page, and invoices
- PWA manifest and service worker (installable on phones)
- Back/Home buttons on all pages
- Employee lock-out system (isActive field + toggle on Team page)
- Activity tracking router (log, heartbeat, recent, byUser, onlineUsers)

## Current Work (July 6, 2026):
- Activity tracking backend DONE (router + db functions + schema)
- Need to add online status indicators to Team page
- Need to add heartbeat hook for presence tracking on frontend

## File Locations:
- Schema: /home/ubuntu/acme-fleet/drizzle/schema.ts
- Routers: /home/ubuntu/acme-fleet/server/routers.ts
- DB helpers: /home/ubuntu/acme-fleet/server/db.ts
- Storage: /home/ubuntu/acme-fleet/server/storage.ts
- Dashboard: /home/ubuntu/acme-fleet/client/src/pages/Home.tsx
- General Work: /home/ubuntu/acme-fleet/client/src/pages/GeneralWork.tsx
- Invoices: /home/ubuntu/acme-fleet/client/src/pages/Invoices.tsx
- Clients: /home/ubuntu/acme-fleet/client/src/pages/Clients.tsx
- Client Overview: /home/ubuntu/acme-fleet/client/src/pages/ClientOverview.tsx
- Time Billing: /home/ubuntu/acme-fleet/client/src/pages/TimeBilling.tsx
- Invoice Scanner: /home/ubuntu/acme-fleet/client/src/pages/InvoiceScanner.tsx
- Team: /home/ubuntu/acme-fleet/client/src/pages/Team.tsx
- Layout: /home/ubuntu/acme-fleet/client/src/components/DashboardLayout.tsx
- App routes: /home/ubuntu/acme-fleet/client/src/App.tsx

## Last checkpoint: 26ff857f
