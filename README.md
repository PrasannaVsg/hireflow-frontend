# HireFlow Frontend

Angular 17 single-page application for the HireFlow AI-powered recruiting platform. Provides a dark-themed recruiter dashboard for managing jobs, candidates, AI rankings, outreach emails, and team users.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Local Setup](#local-setup)
- [Environment Config](#environment-config)
- [Project Structure](#project-structure)
- [Features](#features)
- [Authentication](#authentication)
- [Dark Theme](#dark-theme)
- [Connecting to the Backend](#connecting-to-the-backend)

---

## Tech Stack

- **Angular 17** (standalone components, no NgModules)
- **TypeScript 5**
- **SCSS** with CSS custom properties (dark GitHub-style theme)
- **RxJS** (HTTP, reactive forms)
- **Angular Router** (lazy-loaded routes)
- **JWT** (client-side decode for user identity — no extra API call)

---

## Prerequisites

- [Node.js 20+](https://nodejs.org/)
- [npm 10+](https://www.npmjs.com/)
- [Angular CLI 17](https://angular.io/cli): `npm install -g @angular/cli`
- HireFlow backend running on `http://localhost:8080` (see backend README)

---

## Local Setup

### Step 1: Clone the repository

```bash
git clone https://github.com/PrasannaVsg/hireflow-frontend.git
cd hireflow-frontend
```

### Step 2: Install dependencies

```bash
npm install
```

### Step 3: Start the dev server

```bash
ng serve
```

App runs at: `http://localhost:4200`

The dev server proxies all `/api` requests to `http://localhost:8080` — make sure the backend is running first.

### Step 4: Build for production

```bash
ng build --configuration production
```

Output is in `dist/hireflow-frontend/`.

---

## Environment Config

Edit `src/environments/environment.ts` for local development:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api/v1'
};
```

Edit `src/environments/environment.prod.ts` for production builds.

---

## Project Structure

```
src/
├── app/
│   ├── app.component.*          # App shell: sidebar, nav, router outlet
│   ├── app.routes.ts            # Top-level routes (lazy-loaded pages)
│   ├── guards/
│   │   └── auth.guard.ts        # Redirect to /login if no valid JWT
│   ├── interceptors/
│   │   └── auth.interceptor.ts  # Attaches Bearer token to every request
│   ├── services/
│   │   └── auth.service.ts      # Login, logout, JWT decode, user info
│   └── pages/
│       ├── login/               # Login page
│       ├── dashboard/           # Analytics overview
│       ├── jobs/                # Job list + create/edit
│       ├── candidates/          # Candidate table with AI scores
│       ├── pipeline/            # Kanban pipeline board
│       ├── rankings/            # AI ranking results
│       ├── outreach/            # Outreach email drafts
│       ├── audit/               # Audit log viewer
│       └── users/               # Team user management
├── environments/
│   ├── environment.ts           # Dev config
│   └── environment.prod.ts      # Prod config
└── styles.scss                  # Global dark theme variables + resets
```

---

## Features

| Page | Description |
|---|---|
| **Dashboard** | Key metrics: open jobs, active candidates, AI rankings run, hiring funnel chart |
| **Jobs** | Create, publish, update, and delete job requisitions |
| **Candidates** | View all candidates with AI score, Voyage rank, Claude score, skill breakdown, and rationale |
| **Pipeline** | Kanban board — drag candidates through SOURCED → SCREENING → INTERVIEW → OFFER → HIRED/REJECTED |
| **Rankings** | View AI ranking results per job; trigger a new ranking run |
| **Outreach** | Review AI-generated email drafts; approve and send |
| **Audit Log** | Read-only trail of all actions taken on the platform |
| **Users** | Admin panel: create users, assign roles, enable/disable accounts, reset passwords |

---

## Authentication

- Login stores `accessToken` and `refreshToken` in `localStorage`.
- `AuthInterceptor` attaches `Authorization: Bearer <token>` to every outgoing request.
- `AuthGuard` redirects unauthenticated users to `/login`.
- User identity (name, role, initials) is read directly from the JWT payload using `atob()` — no extra API call. The backend includes `fullName` and `role` in the access token.
- When `mustChangePassword` is true on login, the user is redirected to a change-password screen before accessing the app.

### JWT Claims Used by Frontend

| Claim | Used for |
|---|---|
| `fullName` | Sidebar display name + avatar initials |
| `role` | Sidebar role label; route guards for admin-only pages |
| `org` | Organisation ID for scoped API calls |
| `email` | Fallback display if `fullName` is absent |

---

## Dark Theme

All colors are defined as CSS custom properties in `src/styles.scss`:

| Variable | Value | Usage |
|---|---|---|
| `--bg-primary` | `#161B22` | Cards, sidebar, modals |
| `--bg-secondary` | `#1C2433` | Hover states, inputs |
| `--bg-tertiary` | `#0D1117` | Page background |
| `--border` | `#30363D` | All borders |
| `--text-primary` | `#E6EDF3` | Body text |
| `--text-secondary` | `#8B949E` | Labels, subtitles |
| `--purple` | `#2F81F7` | Primary accent (buttons, links, active nav) |
| `--green` | `#3FB950` | Success, hired stage |
| `--red` | `#F85149` | Danger, rejected stage |
| `--orange` | `#D29922` | Warning, medium scores |

Components use these variables directly — switching the theme requires only changing values in `styles.scss`.

---

## Connecting to the Backend

The frontend expects the HireFlow backend at `http://localhost:8080`. Ensure:

1. Docker containers are running (`docker-compose up -d postgres redis minio`)
2. Spring Boot app is started in Eclipse or via `mvn spring-boot:run`
3. Backend is healthy: `http://localhost:8080/actuator/health`

If the backend is on a different host/port, update `environment.ts` accordingly.

Default login credentials (seeded by Flyway migration V4):

| Field | Value |
|---|---|
| Email | `admin@hireflow.io` |
| Password | `changeme` |

> After first login you will be prompted to change the password (`mustChangePassword = true`).
