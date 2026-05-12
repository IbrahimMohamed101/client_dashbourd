# utils

## Overview
Largest directory (55 files). Organized by entity function.

## Categories
- **Fetch/mutation helpers** — axios wrappers per entity (meals, categories, packages, subscriptions, dashboard, auth, etc.)
- **Menu mappers** — transforms API menu payloads into display format
- **Form submit handlers** — wraps form submission with mutation calls
- **Notification helpers** — sonner toast wrappers

## Conventions
- One file per entity action pattern
- Fetch helpers call `apis.ts` axios instance
- Mutation helpers used by TanStack Query hooks
- Mappers are pure functions — no side effects
