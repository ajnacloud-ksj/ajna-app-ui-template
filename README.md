# {{app-name}} — UI

React 19 + TypeScript + Vite frontend for the **{{app-name}}** Ajna platform app.

It is a multi-tenant SaaS shell with authentication, role-based permissions,
user management, per-tenant field configuration, an audit log, and a generic
example CRUD feature (`items`) you can clone for your own domain entities.

## Tech Stack

- **React 19** + **TypeScript** + **Vite**
- **React Router** (`react-router-dom`) for routing
- **TanStack Query** for server state
- **React Hook Form** + **Yup** for forms and validation
- **Tailwind CSS** + **shadcn/ui** (Radix primitives) for UI
- **Axios** for the API client, **Sonner** for toasts

## Project Structure

```
src/
├── app.tsx                 # Route tree + provider composition
├── main.tsx                # React entry point
├── index.css               # Tailwind layers + design tokens
├── components/
│   ├── protected-route.tsx
│   └── ui/                 # shadcn/ui primitives
├── contexts/               # auth, permissions, query, theme
├── layouts/app-layout.tsx  # App shell (sidebar + topbar)
├── lib/                    # api (axios), utils (cn), yup setup
├── features/               # Feature modules (api/hooks/schema/types)
│   ├── auth/
│   ├── items/              # ← generic CRUD example, clone this
│   ├── users/
│   ├── roles/
│   ├── field-config/
│   ├── audit-logs/
│   ├── tenants/
│   └── tenant-config/
└── pages/                  # Route components
    ├── login/  dashboard/  not-found/
    ├── items/              # index / create / edit / view / form
    ├── users/  role-permissions/  field-config/  audit-log/
```

## Getting Started

```bash
npm install
cp .env.example .env        # set VITE_API_URL
npm run dev                 # http://localhost:5173
```

`VITE_API_URL` must point at the backend (default `http://localhost:8000/v1`).
When running the full stack via the repo's `dev.sh` / docker-compose, this is
wired automatically.

## Adding a Domain Feature

The `items` feature + `pages/items/*` is the reference CRUD implementation:

1. Copy `src/features/items/` → `src/features/<entity>/`.
2. Copy `src/pages/items/` → `src/pages/<entity>/`.
3. Update `types.ts`, `schema.ts`, `api.ts` endpoints, and the form fields.
4. Register routes in `src/app.tsx` and a nav entry in `src/layouts/app-layout.tsx`.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — type-check + production build
- `npm run preview` — preview the production build
- `npm run lint` — ESLint
- `npm run typecheck` — `tsc --noEmit`
- `npm run format` — Prettier

## Deployment

Pushing to `main` (prod) or `develop` (dev) triggers
`.github/workflows/deploy-ui.yml`, which builds the static site and deploys it
to S3 + CloudFront via the shared reusable workflow. Cognito and API URL config
come from GitHub environment variables.
