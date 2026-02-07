# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BarberIA is a SaaS barbershop management system built with React, TypeScript, Vite, TailwindCSS, and Firebase. It's a mobile-first application with dark theme only.

## Commands

```bash
# Development
npm run dev              # Start dev server (localhost:3000)
npm run build            # Build for production (validates env vars)
npm run lint             # TypeScript type checking (tsc --noEmit)

# E2E Testing (Playwright)
npm run test:e2e         # Run all tests
npm run test:e2e:ui      # Interactive UI mode
npm run test:e2e:debug   # Debug mode
npm run test:e2e:headed  # Run with visible browser
npx playwright test <file>  # Run specific test file
```

## Architecture

### Data Flow Pattern
**Store → Hook → Component**
1. **Zustand stores** (`src/store/`) - 8 stores for global state
2. **Custom hooks** (`src/hooks/`) - 8 hooks abstracting store logic
3. **Components** consume hooks for data and actions

### Feature-Based Structure
Each feature in `src/features/` is self-contained with its own pages and components:
- `auth/`, `booking/`, `dashboard/`, `appointments/`, `agenda/`, `clients/`, `financial/`, `history/`, `profile/`, `settings/`

### Service Layer
`BaseService<T>` in `src/services/` provides generic Firestore CRUD.
Collection path: `barbershops/{userId}/{collectionName}`

### Route Types
- **Protected** (Firebase Auth): `/dashboard`, `/agenda`, `/clients`, `/financial`, `/profile`, `/settings/*`
- **Public**: `/booking` (WhatsApp link only, no Firebase persistence)

## Critical Patterns

### BarbershopStore Naming
- Type: `Barber` (not `Professional`)
- Returns: `shopInfo` object (not `barbershop`), `barbers` array (not `professionals`)
- Methods: `addBarber`, `updateBarber`, `removeBarber`

### Icons
Always use `Icon.tsx` component. Never import from `react-icons/bi` directly.

### Firestore Rules
`service` is a **reserved keyword**:
- Wrong: `request.resource.data.service.size()`
- Correct: `request.resource.data['service'].size()`

### Portuguese Localization
All user-facing text and enum values in Portuguese:
```typescript
AppointmentStatus.Confirmed = "Confirmado"
ClientStatus.Active = "Ativo"
```

### Mobile-First Container
`max-w-md mx-auto` with `min-h-screen` - 428px max width, centered

### Dark Theme Colors
- Background: `slate-950`, `slate-900`, `slate-800`
- Primary: `violet-600`, `violet-500`
- Text: `white`, `slate-300`
- Status: `green-500` (success), `red-500` (error)

## Key Files
- `src/types.ts` - All TypeScript interfaces and enums
- `src/lib/validations.ts` - Zod schemas for all entities
- `src/firebase.ts` - Firebase config with troubleshooting comments
- `firestore.rules` - Firestore security rules

## E2E Testing

Test credentials: `teste@exemplo.com` / `senha123`

Important patterns:
- Navigation: `page.goto('/#/route')` (HashRouter)
- Button selectors: `button:has-text("Entrar")`
- Form inputs: Use `placeholder` attribute, not `name`
- Timeout: Use `test.setTimeout(60000)` inside test function, not globally
- Services field uses checkboxes, not `<select multiple>`

## Environment Variables

Required in `.env.local`:
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
VITE_FIREBASE_APP_CHECK_KEY      # reCAPTCHA v3 site key
```

## Security & Performance Remediations

### 1. Data Protection (LGPD/GDPR)
- **`availability` collection:** Public-facing data without PII (date, time, barber, duration).
- **PII Isolation:** `appointments` collection containing client names/phones is restricted to authenticated owners.
- **Sync:** `AppointmentService` syncs changes to `availability` automatically.

### 2. Cost & Performance
- **Firestore Pagination:** Cursor-based (`fetchRecentAppointments`, `fetchMoreAppointments`).
- **Total Count Estimation:** Shows "100 of ~350 appointments" without extra queries.
- **Excel Export:** Efficient export system with `xlsx` library, respects filters and pagination.
- **Safety Limits:**
    - History: 100 initial + "Load More" (50 items).
    - Dashboard: 50 upcoming limit.
    - Global: 200 items safety limit.
- **Base Service:** Supports `limitCount` parameter.

## Future Optimizations

### Server-Side Filters via Cloud Functions
**What:** Move search filters to backend using Cloud Functions.  
**Why:** Reduce reads from 1,000 → 50 for searches in large datasets (95% savings).  
**When:** Dataset > 10,000 appointments.  
**Effort:** 8-12 hours.

### Infinite Scroll
**What:** Auto-load on scroll instead of "Load More" button.  
**Why:** Modern UX, reduces manual clicks.  
**When:** Users frequently click "Load More" multiple times.  
**Effort:** 4-6 hours.

### E2E Tests for Pagination
**What:** Playwright tests validating pagination behavior.  
**Why:** Prevent regressions, ensure data integrity.  
**When:** Before multi-user production launch.  
**Effort:** 3-4 hours.

### Auto-Archival (>2 years)
**What:** Archive appointments older than 2 years to separate collection.  
**Why:** Keep main collection light, faster queries.  
**When:** ~5,000+ historical appointments.  
**Effort:** 6-8 hours.

### Cost Monitoring Dashboard
**What:** Real-time Firestore read tracking and cost estimation.  
**Why:** Visibility, alerts, identify problematic queries.  
**When:** Exceed 50% of Firebase free tier.  
**Effort:** 8-12 hours.

## Terminal Note

This project uses CMD (not PowerShell). For paths with brackets like `[APP]`, use `-LiteralPath` in PowerShell.
