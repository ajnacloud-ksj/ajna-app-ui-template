# Frontend - AGENTS.md

## 🏗 Feature Architecture

The project follows a strict feature-based modular structure within the `features/` directory. Each feature is self-contained and should be organized as follows:

- **`api.ts`**: Contains low-level API call functions using the `api` axios instance.
- **`queries.ts`**: Defines TanStack Query key factories and query options.
- **`hooks.ts`**: Contains custom React hooks that wrap queries and mutations for use in components.
- **`types.ts`**: Houses all TypeScript definitions for the feature.
- **`schema.ts`**: Contains validation schemas (typically Yup) and form-related types.

The `items` feature is the canonical CRUD example — clone it when adding a new domain entity.

### 🏷 Naming Conventions

- **Files**: Use `kebab-case` for all filenames (e.g., `file-name.tsx`).
- **Variables**: Use descriptive, camelCase names for variables and functions.
- **Types & Interfaces**:
  - All **Interfaces** must begin with a capital **`I`** (e.g., `IInterface`).
  - All **Types** must begin with a capital **`T`** (e.g., `TType`).

---

## 📝 Coding Standards

### 1. Forms & Validation

- **React Hook Form**: Always use `react-hook-form` for managing form state.
- **UI Components**: Use the shared components from `components/ui/` (e.g., `Form`, `Input`, `Button`) instead of raw HTML elements.
- **Schemas**: Define validation logic in `schema.ts` using Yup.

### 2. Design & Aesthetics

- **System Colors**: Do not use arbitrary Tailwind color classes. Always use the predefined design tokens and CSS variables established in the system (e.g., `text-primary`, `bg-card`).
- **Design Decisions**: Follow the existing aesthetic—modern, high-end, and interactive. Use smooth transitions and consistent spacing.
- **Reusability**: Before creating a new component, check `components/` and existing features. Reuse and extend existing patterns whenever possible.
- Never rely on hover for actions such as edit, add, or delete, as this creates issues for mobile users.
- **Performance**: Never use `blur` or `backdrop-blur` effects. They are heavy on low to mid-end mobile devices and cause significant performance drops.

### 3. Component Structure

- Keep components focused and small.
- Extract complex logic into feature-specific hooks.
- Ensure proper accessibility and semantic HTML.

---

## 🚀 Development Workflow

- **State Management**: Use TanStack Query for all server state. Avoid global state unless absolutely necessary.
- **Error Handling**: Use the built-in notification system (`sonner`) for user feedback.
- **Routing**: React Router (`react-router-dom`) with a protected `AppLayout` shell.
- **Verification**: No need to check changes by accessing the local browser where the UI is running. Rely on code analysis and type checking.

- Only use npm package manager, not bun or anything else.
- you will never commit or stage files by yourself.

---

## 🛠 Useful Commands

- `npm run dev`: Start the Vite development server.
- `npm run format`: Format code with Prettier.
- `npm run lint`: Run ESLint checks.
- `npm run typecheck`: Run TypeScript compiler check.
- `npm run build`: Type-check and build for production.
