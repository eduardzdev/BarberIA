# AGENTS.md

This file provides guidance to AI coding agents working in this BarberIA repository.

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

## Code Style Guidelines

### Imports
- Use `@/` path alias for all internal imports (configured in tsconfig.json)
- Icons: ALWAYS use `<Icon name="scissors" />` component from `src/components/Icon.tsx`
- NEVER import from `react-icons/bi` directly
- Barrel exports: Each feature has `index.ts` in `src/features/*/`

### Types
- All interfaces in `src/types.ts`
- Zod validation schemas in `src/lib/validations.ts`
- Use inferred types: `type LoginInput = z.infer<typeof loginSchema>`
- Strict TypeScript enabled - avoid `any`

### Naming Conventions
- Components: PascalCase (`LoginPage`, `Card`)
- Hooks: camelCase with `use` prefix (`useAuth`, `useBarbershop`)
- Stores: camelCase with `.store.ts` suffix (`auth.store.ts`)
- Services: camelCase with `.service.ts` suffix (`appointment.service.ts`)
- Functions/Variables: camelCase
- Enums: PascalCase (`AppointmentStatus`)

### Error Handling
- Try/catch all async functions
- Use `console.error()` with context (include collection/entity name)
- Error state in Zustand stores: `error: string | null`
- Throw errors from services, catch in hooks/components

### Component Pattern
```typescript
interface Props {
  children?: React.ReactNode;
  className?: string;
}

export const ComponentName: React.FC<Props> = ({ children, className }) => {
  return <div className={className}>{children}</div>;
};
```

## Architecture Patterns

### Data Flow
**Store → Hook → Component**
- Zustand stores in `src/store/` (8 stores for global state)
- Custom hooks in `src/hooks/` (8 hooks abstracting store logic)
- Components consume hooks for data and actions

### Feature-Based Structure
Each feature in `src/features/` is self-contained:
- `pages/` - Page components
- `components/` - Feature-specific components
- `index.ts` - Barrel exports

### Service Layer
`BaseService<T>` in `src/services/base.service.ts` provides generic Firestore CRUD:
- Collection path: `barbershops/{userId}/{collectionName}`
- Extend this class for all entity services
- Methods: `getAll()`, `getById()`, `create()`, `update()`, `delete()`

### Mobile-First Container
Use `max-w-md mx-auto` with `min-h-screen` - 428px max width, centered

## Critical Conventions

### Icons
Use `<Icon name="scissors" />` - NEVER import from `react-icons/bi` directly.
Available icon names in `src/components/Icon.tsx`.

### Localization
All user-facing text and enum values in Portuguese:
```typescript
AppointmentStatus.Confirmed = "Confirmado"
ClientStatus.Active = "Ativo"
```

### Dark Theme Only
- Background: `slate-950`, `slate-900`, `slate-800`
- Primary: `violet-600`, `violet-500`
- Text: `white`, `slate-300`
- Status: `green-500` (success), `red-500` (error)

### Firestore Rules
`service` is a **reserved keyword**:
- Wrong: `request.resource.data.service.size()`
- Correct: `request.resource.data['service'].size()`

### BarbershopStore Naming
- Type: `Barber` (not `Professional`)
- Returns: `shopInfo` object (not `barbershop`), `barbers` array (not `professionals`)
- Methods: `addBarber`, `updateBarber`, `removeBarber`

## Security & Performance Remediations

### 1. Data Protection (LGPD/GDPR)
- **`availability` collection:** Public-facing data without PII (date, time, barber, duration).
- **PII Isolation:** `appointments` collection containing client names/phones is restricted to authenticated owners.
- **Sync:** `AppointmentService` syncs changes to `availability` automatically.

### 2. Cost & Performance
- **Firestore Pagination:** Cursor-based (`fetchRecentAppointments`, `fetchMoreAppointments`).
- **Total Count Estimation:** Approximate count display ("100 of ~350") without extra reads.
- **Excel Export:** `export.service.ts` with `xlsx` library for efficient data export.
- **Safety Limits:**
    - History: 100 initial + "Load More" (50 items).
    - Dashboard: 50 upcoming limit.
    - Global: 200 items safety limit.
- **Base Service:** Supports `limitCount` parameter.

## Future Optimization Roadmap

Recommended improvements for long-term scalability:

### 1. Server-Side Filters (Cloud Functions)
**Purpose:** Move search/filter logic to backend to reduce client-side data loading.  
**Impact:** 95% reduction in Firestore reads for searches when dataset > 10k appointments.  
**Trigger:** Implement when users report slow searches or dataset exceeds 10,000 records.  
**Effort:** 8-12 hours.

### 2. Infinite Scroll
**Purpose:** Replace "Load More" button with automatic loading on scroll.  
**Impact:** Better UX, reduced clicks, perceived performance improvement.  
**Trigger:** When users frequently need multiple manual "Load More" clicks.  
**Effort:** 4-6 hours.

### 3. E2E Tests for Pagination
**Purpose:** Automated Playwright tests for pagination flows.  
**Impact:** Prevent regressions, ensure data integrity with large datasets.  
**Trigger:** Before production launch with multiple users.  
**Effort:** 3-4 hours.

### 4. Auto-Archival System
**Purpose:** Automatically move appointments >2 years old to archive collection.  
**Impact:** Faster queries on main collection, reduced costs on daily operations.  
**Trigger:** When reaching ~5,000 historical appointments.  
**Effort:** 6-8 hours.

### 5. Cost Monitoring Dashboard
**Purpose:** Track Firestore reads in real-time with cost estimates and alerts.  
**Impact:** Visibility into usage patterns, proactive cost management.  
**Trigger:** When approaching 50% of Firebase free tier quota.  
**Effort:** 8-12 hours.

## Testing Patterns

Test credentials: `teste@exemplo.com` / `senha123`

### Navigation
Use HashRouter: `page.goto('/#/dashboard')`

### Selectors
- Buttons: `button:has-text("Entrar")`
- Form inputs: Use `placeholder` attribute, NOT `name`
- Example: `page.fill('input[placeholder="seu@email.com"]', email)`

### Timeout
Use `test.setTimeout(60000)` inside test function, NOT globally

### Special Handling
- Services field uses checkboxes, NOT `<select multiple>`
- Wait for network idle: `await page.waitForLoadState('networkidle')`

## Key Files Reference

- `src/types.ts` - All TypeScript interfaces and enums
- `src/lib/validations.ts` - Zod schemas for all entities
- `src/firebase.ts` - Firebase config with env var validation
- `src/services/base.service.ts` - Generic CRUD service pattern

## Route Types

- **Protected** (Firebase Auth): `/dashboard`, `/agenda`, `/clients`, `/financial`, `/profile`, `/settings/*`
- **Public**: `/booking` (WhatsApp link only, no Firebase persistence)
- **Public Shop**: `/:slug` (embedded booking page)
