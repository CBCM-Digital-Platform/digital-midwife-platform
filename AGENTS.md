<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Digital Midwife Mentoring App — Agent Instructions & Project Guidelines

## 1. Project Overview & Clinical Mentorship Workflow
The **Digital Midwife Mentoring App** is an adolescent health education and clinical mentorship platform designed for facility-led healthcare operations with strict Role-Based Access Control (RBAC).

### User Roles & Responsibilities
- **Administrator (`admin`)**: Manages facilities, user accounts, system configuration, resource library approval, and cross-facility analytics.
- **Midwife Mentor (`mentor`)**: Monitors mentee progress, assigns learning modules, conducts mentoring sessions, and evaluates clinical logbook submissions and assessments.
- **Mentee (`mentee`)**: Junior midwives and students completing clinical learning modules, logging procedural activity in logbooks, and sitting for competency assessments.

---

## 2. Tech Stack & Architecture
- **Framework**: Next.js 16 (App Router) with React 19 & TypeScript.
- **Styling**: Tailwind CSS v4 (`@import "tailwindcss"` with `@theme inline`), `tw-animate-css`.
- **UI Components**: Shadcn UI (`base-nova` style configuration in `components.json`), Lucide React icons (`lucide-react`).
- **Data Tables**: `@tanstack/react-table`.
- **Authentication**: NextAuth.js v4 (Auth.js) Credentials Provider with JWT session strategy.
- **Backend Communication**: Node.js backend (currently mocked locally on the frontend until production endpoints are connected).

---

## 3. Critical Safeguards & Protected Files
> [!IMPORTANT]
> **DO NOT overwrite or alter the following files without explicit instructions:**
> - `src/middleware.ts` — Global route protection checking NextAuth JWT tokens and redirecting unauthenticated traffic to `/login`.
> - `src/app/api/auth/[...nextauth]/route.ts` — Core NextAuth configuration, credential provider logic, mock account bindings, and JWT/session role mapping.

### Active Mock Accounts (Local Development)
- **Admin**: `admin@test.com` / `password` (`role: "admin"`)
- **Mentor**: `mentor@test.com` / `password` (`role: "mentor"`)
- **Mentee**: `mentee@test.com` / `password` (`role: "mentee"`)

---

## 4. Routing & Dynamic Dashboard Pattern
The application follows a **Single Unified Dashboard Route** pattern rather than separate path prefixes (`/admin/dashboard`, `/mentor/dashboard`).

- **Unprotected Routes**: Grouped inside `src/app/(auth)/` (e.g., `/login`, `/forgot-password`).
- **Protected Routes**: Grouped inside `src/app/(dashboard)/`.
- **Dynamic Layout (`src/app/(dashboard)/layout.tsx`)**:
  - Reads user session and role via `getServerSession(authOptions)`.
  - Dynamically renders role-specific sidebar navigation items (256px / `w-64` persistent left sidebar) and header controls.
- **Dynamic Dashboard (`src/app/(dashboard)/dashboard/page.tsx`)**:
  - Evaluates `session.user.role` to render distinct UI views:
    - `admin` → Admin Overview (facility management, metrics, settings).
    - `mentor` → Mentor Analytics & Mentees Overview (stat cards, activity feed, upcoming sessions).
    - `mentee` → Mentee Curriculum & Pathway (active modules, progress tracker, next lessons).

---

## 5. Security & Data Fetching Guidelines
- **Server Component Data Fetching**:
  All protected dashboard pages fetching or querying data must verify the session and user role:
  ```typescript
  import { getServerSession } from "next-auth/next";
  import { authOptions } from "@/app/api/auth/[...nextauth]/route";

  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  ```
- **Client Route Guards**:
  Where client components require role enforcement, read from NextAuth's `useSession()` or receive validated server props.
- **Strict Typing**:
  Always define explicit TypeScript interfaces/types for React component props, form states, and API responses. Do not use loose `any` types for domain models.

---

## 6. UI / UX Design System & Tokens
- **Brand Colors**:
  - **Primary Green**: `#194611` — Used for main headings, primary call-to-actions, and emphasized typography.
  - **Secondary Yellow**: `#FDD028` — Used for active sidebar navigation indicators, warning badges, and highlight actions.
- **Layout Specifications**:
  - Fixed persistent sidebar: Width `w-64` (256px), white background, light gray borders.
  - Top header: Height `h-20`, includes search bar, notification bell, and emergency support trigger.
  - Main view: Flex child with `overflow-y-auto` and standard `p-8` spacing.
- **Asset Optimization Quirk**:
  - When referencing `/logo.png` or local branding images, use Next.js `<Image ... unoptimized />` or standard `<img>` tags to avoid Turbopack local compilation issues.
- **Component Conventions**:
  - When creating new UI components, use Shadcn UI primitives located in `@/components/ui`.
  - When building tables for users, facilities, logs, or assessments, use `@tanstack/react-table`.
