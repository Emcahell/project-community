---
name: frontend-anti-tech-debt
description: Frontend Architecture & Anti-Technical-Debt Guardrails for React, Next.js, Astro, and modern web applications.
version: 1.0.0
author: Emcahell
tags: [react, nextjs, typescript, architecture, performance, state-management, clean-code]
---

# Frontend Architecture & Anti-Technical-Debt Guardrails

This skill establishes strict architectural standards and quality guardrails for frontend applications (React, Next.js, Astro, TypeScript) to prevent code rot, performance degradation, and maintainability issues.

---

## 1. Separation of Concerns & Modular Design
- **Single File Length Rule:** A React component file MUST NOT exceed **150 lines of code**. If it exceeds this threshold, it must be refactored into smaller sub-components or custom hooks.
- **Presenter vs. Container Pattern:**
  - UI components are strictly presentational. They only handle markup, styling, and simple layout events.
  - Business logic, complex data transformations, and side effects MUST be extracted into standalone custom hooks (e.g., `useUserProfile.ts`).
  - Form handling MUST use validation frameworks (React Hook Form + Zod). NEVER manage massive form states with manual local `useState` objects.

---

## 2. State Management Rules
- **Local-First State Principle:**
  - Use `useState` or `useReducer` strictly for ephemeral UI state (e.g., toggles, dropdown visibility, local input values).
- **Global Store Usage (Zustand/Redux):**
  - Global stores are reserved EXCLUSIVELY for cross-cutting state shared across different routes or distant module boundaries (e.g., session auth, active theme, global notifications).
  - DO NOT store local modal states, form data, or page-specific temporary lists in global stores.
- **Asynchronous & Server State:**
  - **PROHIBITED:** Manual asynchronous state management using `useEffect` + `fetch` with manual `loading`, `error`, and `data` state flags.
  - **MANDATORY:** Use dedicated server-state and fetching libraries (TanStack Query / SWR / framework-native hooks) for automatic caching, revalidation, and error handling.

---

## 3. Rendering Optimization & Performance Guardrails
- **Reference Stability:** Avoid defining inline functions or non-primitive object literals directly inside render bodies when passing them as props to heavily nested or list-item components.
- **Targeted Re-renders:**
  - Structure state as close to where it is used as possible ("pushing state down") to avoid top-level root re-renders.
  - Use `React.memo`, `useCallback`, and `useMemo` deliberately—apply them to heavy list renders or expensive computations, not trivially to every simple component.
- **Asset & Image Optimization:** Always enforce modern responsive formats (`webp`/`avif`), define explicit width/height dimensions to prevent Layout Shift (CLS), and leverage dynamic imports (`React.lazy` / `next/dynamic`) for heavy non-critical UI overlays.

---

## 4. Testability & Integration Guardrails
- **Test-Driven Architecture:**
  - Every custom hook and utility function MUST be a pure, isolated unit that can be tested independently (e.g., via Vitest/Jest).
  - If a component is impossible to test without mocking dozens of global context wrappers or side effects, treat it as an architectural failure and refactor immediately.
- **Accessible & Queryable DOM:**
  - Ensure interactive elements feature semantic HTML and accessibility attributes (`aria-label`, `role`, or explicit data identifiers) to enable integration testing (Testing Library / Playwright).
