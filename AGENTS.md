# Frontend Guidelines

## Scope and Structure

Build the client with React, TypeScript, Vite, and npm. Keep application code in `src/`, static public files in `public/`, and tests beside the unit under test as `*.test.ts` or `*.test.tsx`. Use `src/components/` for reusable UI, `src/pages/` for route-level screens, `src/api/` for typed HTTP clients, and `src/features/` for domain workflows. Treat `KB_Housing_AI_Design_Tokens.md` and `image/` as the visual source of truth.

## Commands

Maintain these npm scripts when scaffolding the application:

```bash
npm install
npm run dev
npm run test
npm run test -- --run
npm run lint
npm run build
```

Use Vitest and React Testing Library. The development API base URL should be configurable and default to `http://localhost:8080/api/v1` through Vite environment variables.

## TDD and UI Testing

Follow Red, Green, Refactor. Start with a failing user-observable test, implement only enough behavior to pass, and then clean up. Prefer accessible queries such as role, label, and visible text over implementation selectors. Test loading, error, empty, validation, and successful states. Mock the network boundary rather than component internals, and cover SSE connection, incremental messages, errors, and reconnection behavior. Add screenshots to pull requests for visual changes.

## Style and Naming

Use two-space indentation, strict TypeScript, `PascalCase` components, `camelCase` hooks and functions, and `useXxx` hook names. Keep components focused and avoid embedding API calls directly in presentation components. Do not introduce colors, spacing, or typography that duplicate an existing design token.
