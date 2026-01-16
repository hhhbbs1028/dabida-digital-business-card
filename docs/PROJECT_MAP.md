# Project Map: Dabida Digital Business Card

## Overview
React + TypeScript + Vite + Tailwind + Supabase application for creating and managing digital business cards.

---

## Top-Level Structure

### `/src` - Main Source Code
Primary application code directory.

### `/dist` - Build Output
Vite build output (generated, not tracked).

### `/node_modules` - Dependencies
NPM packages (not tracked).

### Root Config Files
- `vite.config.mts` - Vite configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.cjs` - PostCSS configuration
- `package.json` - Dependencies and scripts
- `index.html` - Entry HTML file
- `001_create_cards_table.sql` - Supabase migration (should be in `/supabase/migrations`)

---

## `/src` Directory Structure

### `/src/auth/` - Authentication UI Components
**Purpose:** OAuth login UI components

#### `AuthButtons.tsx`
- **Responsibilities:**
  - Renders OAuth login buttons (Google, GitHub, Apple)
  - Handles OAuth redirect flow
  - Provides SignOutButton component
- **Key Exports:** `AuthButtons`, `SignOutButton`
- **Dependencies:** `lib/supabaseClient`
- **Used By:** `pages/LoginPage.tsx`, `pages/AppPage.tsx`
- **Issues:**
  - Directly imports `supabase` instead of using `useAuth` hook
  - Mixes UI and auth logic

---

### `/src/components/` - Reusable UI Components
**Purpose:** Shared, reusable UI components

#### `ProfileForm.tsx`
- **Responsibilities:**
  - Profile editing form (name, university, major, SNS, skill tags)
  - Form validation
  - Calls `upsertMyProfile` API
- **Key Exports:** `ProfileForm`
- **Dependencies:** `lib/profileApi`
- **Used By:** `pages/Onboarding.tsx`, `pages/AppPage.tsx`, `pages/ProfileSetupPage.tsx`
- **Issues:**
  - Domain-specific (profile) but placed in generic `components/`
  - Should be in `features/profile/` or `features/onboarding/`

#### `StepTabs.tsx`
- **Responsibilities:**
  - Wizard-style step navigation tabs
- **Key Exports:** `StepTabs`
- **Dependencies:** None (pure UI)
- **Used By:** `CardEditor.tsx`
- **Issues:**
  - Card-specific component but in generic `components/`
  - Should be co-located with `CardEditor`

#### `OptionalFieldGroup.tsx`
- **Responsibilities:**
  - Accordion-style collapsible field group
- **Key Exports:** `OptionalFieldGroup`
- **Dependencies:** None (pure UI)
- **Used By:** `CardEditor.tsx`
- **Issues:**
  - Card-specific component but in generic `components/`

#### `AuthPanel.tsx` ⚠️ **Broken/Legacy**
- **Responsibilities:**
  - Auth status display and login/logout UI
  - Email + GitHub login form
- **Key Exports:** `AuthPanel`
- **Dependencies:** `hooks/useAuth` (but calls non-existent `signInWithGithub`, `signInWithEmail`)
- **Used By:** Only `StudioPage.tsx` (legacy)
- **Issues:**
  - **Broken:** Calls `signInWithGithub()` and `signInWithEmail()` which don't exist in current `useAuth` hook
  - Replaced by `AuthButtons` component
  - Should be deleted

---

### `/src/hooks/` - Custom React Hooks
**Purpose:** Reusable React hooks

#### `useAuth.ts`
- **Responsibilities:**
  - Manages auth state (user, session, loading, error)
  - Subscribes to Supabase auth state changes
  - Provides `signOut` action
- **Key Exports:** `useAuth`
- **Dependencies:** `lib/supabaseClient`
- **Used By:** Most pages, `components/AuthPanel.tsx`
- **Issues:**
  - Auth logic split between `hooks/useAuth` and `auth/AuthButtons`
  - Should consolidate auth-related code

---

### `/src/lib/` - Business Logic & API Clients
**Purpose:** Core business logic, API clients, utilities

#### `supabaseClient.ts`
- **Responsibilities:**
  - Creates and exports Supabase client instance
  - Validates environment variables
  - Configures auth persistence
- **Key Exports:** `supabase` (singleton client)
- **Dependencies:** `@supabase/supabase-js`, env vars
- **Used By:** Almost all files (central dependency)
- **Issues:**
  - Good: Single source of truth for Supabase client
  - Consider: Move to `shared/infrastructure/` or `shared/api/`

#### `profileApi.ts`
- **Responsibilities:**
  - Profile CRUD operations (`getMyProfile`, `upsertMyProfile`)
  - Profile type definitions (`Profile`, `ProfileInput`)
  - Data normalization
- **Key Exports:** `getMyProfile`, `upsertMyProfile`, `Profile`, `ProfileInput`
- **Dependencies:** `lib/supabaseClient`
- **Used By:** `pages/AppPage.tsx`, `pages/Onboarding.tsx`, `pages/AuthCallback.tsx`, `lib/onboardingFlow.ts`, `components/ProfileForm.tsx`
- **Issues:**
  - Domain-specific but in generic `lib/`
  - Should be in `features/profile/api/` or `domains/profile/`

#### `onboardingFlow.ts`
- **Responsibilities:**
  - Onboarding step validation (`isProfileComplete`, `isTemplateSelected`)
  - Profile row creation (`ensureProfileRow`)
  - Step advancement (`maybeAdvanceOnboardingStep`)
  - Route resolution based on onboarding state (`resolveNextRoute`)
- **Key Exports:** `isProfileComplete`, `isTemplateSelected`, `ensureProfileRow`, `maybeAdvanceOnboardingStep`, `resolveNextRoute`, `OnboardingStep`
- **Dependencies:** `lib/profileApi`, `lib/supabaseClient`
- **Used By:** `pages/ProfileSetupPage.tsx`, `pages/TemplateSelectPage.tsx`, `pages/StudioPage.tsx`, `pages/OnboardingPage.tsx`
- **Issues:**
  - **God file:** Mixes routing logic, validation, and profile operations
  - Should be split: routing → `shared/routing/`, validation → `features/onboarding/`, profile ops → `features/profile/`

---

### `/src/pages/` - Route Components
**Purpose:** React Router page components

#### `AppPage.tsx` ⭐ **God File**
- **Responsibilities:**
  - Main application page (card studio)
  - Card CRUD operations (load, create, update, delete)
  - Profile display and editing
  - Card list management
  - Layout (header, sidebar, main content)
- **Key Exports:** `AppPage`
- **Dependencies:** `CardEditor`, `CardPreview`, `lib/supabaseClient`, `hooks/useAuth`, `lib/profileApi`, `components/ProfileForm`, `auth/AuthButtons`
- **Used By:** `App.tsx` (routing)
- **Issues:**
  - **Too many responsibilities:** Card management + Profile management + Layout
  - Should split: Card list → `features/cards/`, Profile display → `features/profile/`, Layout → `shared/layout/`

#### `LoginPage.tsx`
- **Responsibilities:**
  - Login page UI
  - Renders `AuthButtons`
- **Key Exports:** `LoginPage`
- **Dependencies:** `auth/AuthButtons`
- **Used By:** `App.tsx` (routing)
- **Issues:** None (simple, focused)

#### `AuthCallback.tsx`
- **Responsibilities:**
  - OAuth callback handler
  - Session verification
  - Profile check and route redirection
- **Key Exports:** `AuthCallback`
- **Dependencies:** `lib/supabaseClient`, `lib/profileApi`
- **Used By:** `App.tsx` (routing)
- **Issues:**
  - Should use `useAuth` hook instead of direct `supabase.auth.getSession()`
  - Routing logic could use `onboardingFlow.resolveNextRoute`

#### `Onboarding.tsx`
- **Responsibilities:**
  - Profile setup form (first-time user onboarding)
  - Calls `upsertMyProfile` and navigates to `/app`
- **Key Exports:** `Onboarding`
- **Dependencies:** `hooks/useAuth`, `lib/profileApi`
- **Used By:** `App.tsx` (routing)
- **Issues:**
  - Duplicate with `OnboardingPage.tsx`? (both exist)
  - Should use `ProfileForm` component instead of custom form

#### `OnboardingPage.tsx` ⚠️ **Legacy/Unused**
- **Responsibilities:**
  - Route resolver page (uses `resolveNextRoute`)
  - Shows onboarding guide
- **Key Exports:** `OnboardingPage`
- **Dependencies:** `hooks/useAuth`, `lib/profileApi`, `lib/onboardingFlow`
- **Used By:** None (not in `App.tsx` routes)
- **Issues:**
  - **Not used in routing** - legacy code
  - Current flow uses `Onboarding.tsx` instead

#### `ProfileSetupPage.tsx` ⚠️ **Legacy/Unused**
- **Responsibilities:**
  - Profile setup during onboarding flow
  - Uses `ProfileForm` component
  - Route guard (redirects if profile complete)
- **Key Exports:** `ProfileSetupPage`
- **Dependencies:** `components/ProfileForm`, `hooks/useAuth`, `lib/onboardingFlow`
- **Used By:** None (not in `App.tsx` routes)
- **Issues:**
  - **Not used in routing** - legacy code
  - Current flow uses `Onboarding.tsx` instead

#### `TemplateSelectPage.tsx` ⚠️ **Legacy/Unused**
- **Responsibilities:**
  - Template selection UI (template 1/2, colors, fonts)
  - Saves to profile `selected_*` fields
  - Advances onboarding step
- **Key Exports:** `TemplateSelectPage`
- **Dependencies:** `hooks/useAuth`, `lib/onboardingFlow`, `lib/profileApi`
- **Used By:** None (not in `App.tsx` routes)
- **Issues:**
  - **Not used in routing** - legacy code

#### `CompletePage.tsx` ⚠️ **Legacy/Unused**
- **Responsibilities:**
  - Onboarding completion screen
- **Key Exports:** `CompletePage`
- **Dependencies:** `lib/onboardingFlow`
- **Used By:** None (not in `App.tsx` routes)
- **Issues:**
  - **Not used in routing** - legacy code

#### `StudioPage.tsx` ⚠️ **Legacy/Unused**
- **Responsibilities:**
  - Legacy card studio page (similar to `AppPage.tsx`)
  - Uses `AuthPanel` (broken/legacy component)
- **Key Exports:** `StudioPage`
- **Dependencies:** `CardEditor`, `types`, `lib/supabaseClient`, `hooks/useAuth`, `components/AuthPanel`, `lib/profileApi`, `components/ProfileForm`, `lib/onboardingFlow`
- **Used By:** None (not in `App.tsx` routes)
- **Issues:**
  - **Not used in routing** - legacy code
  - Current flow uses `AppPage.tsx` instead
  - Uses broken `AuthPanel` component

---

### Root-Level Files in `/src`

#### `App.tsx`
- **Responsibilities:**
  - React Router configuration
  - Route definitions
- **Key Exports:** `App` (default)
- **Dependencies:** `react-router-dom`, all page components
- **Used By:** `main.tsx`
- **Issues:**
  - Good: Centralized routing
  - Consider: Move routes to `shared/routing/` or `config/routes.tsx`

#### `CardEditor.tsx` ⭐ **Large Component**
- **Responsibilities:**
  - Card editing form (wizard-style with tabs)
  - Form state management
  - Auto-save with debounce
  - Renders `CardPreview` for live preview
- **Key Exports:** `CardEditor`
- **Dependencies:** `CardPreview`, `types`, `components/StepTabs`, `components/OptionalFieldGroup`
- **Used By:** `pages/AppPage.tsx`
- **Issues:**
  - **Large file (518 lines):** Should be split into smaller components
  - At root level but should be in `features/cards/`
  - Mixes form logic, state management, and UI

#### `CardPreview.tsx`
- **Responsibilities:**
  - Renders card preview based on `CardData`
  - Supports 2 templates and orientation (horizontal/vertical)
- **Key Exports:** `CardPreview`
- **Dependencies:** `types`
- **Used By:** `CardEditor.tsx`
- **Issues:**
  - At root level but should be co-located with `CardEditor` in `features/cards/`

#### `types.ts`
- **Responsibilities:**
  - Global type definitions (`CardData`, `FontFamilyOption`)
- **Key Exports:** `CardData`, `FontFamilyOption`
- **Dependencies:** None
- **Used By:** `CardEditor.tsx`, `CardPreview.tsx`, `pages/AppPage.tsx`
- **Issues:**
  - Types should be co-located with features
  - `CardData` → `features/cards/types.ts`
  - Consider: Keep only truly shared types here

#### `main.tsx`
- **Responsibilities:**
  - React app entry point
  - Renders `App` component
- **Key Exports:** None
- **Dependencies:** `App.tsx`, `index.css`
- **Used By:** Vite (entry point)
- **Issues:** None (standard entry point)

#### `index.css`
- **Responsibilities:**
  - Tailwind CSS imports
  - Global styles
- **Dependencies:** Tailwind
- **Used By:** `main.tsx`
- **Issues:** None

---

## Dependency Graph

```
main.tsx
  └─ App.tsx
      ├─ pages/LoginPage.tsx
      │   └─ auth/AuthButtons.tsx
      │       └─ lib/supabaseClient.ts
      ├─ pages/AuthCallback.tsx
      │   ├─ lib/supabaseClient.ts
      │   └─ lib/profileApi.ts
      │       └─ lib/supabaseClient.ts
      ├─ pages/Onboarding.tsx
      │   ├─ hooks/useAuth.ts
      │   │   └─ lib/supabaseClient.ts
      │   └─ lib/profileApi.ts
      └─ pages/AppPage.tsx ⭐ (God File)
          ├─ CardEditor.tsx
          │   ├─ CardPreview.tsx
          │   ├─ types.ts
          │   ├─ components/StepTabs.tsx
          │   └─ components/OptionalFieldGroup.tsx
          ├─ lib/supabaseClient.ts
          ├─ hooks/useAuth.ts
          ├─ lib/profileApi.ts
          ├─ components/ProfileForm.tsx
          │   └─ lib/profileApi.ts
          └─ auth/AuthButtons.tsx
```

---

## Issues Summary

### 🔴 Critical Issues

1. **God Files:**
   - `pages/AppPage.tsx` - Too many responsibilities (cards + profile + layout)
   - `lib/onboardingFlow.ts` - Mixes routing, validation, and profile operations

2. **Duplicates:**
   - `Onboarding.tsx` vs `OnboardingPage.tsx` (both exist)
   - `AppPage.tsx` vs `StudioPage.tsx` (both exist)
   - Need to identify which are active and remove dead code

3. **Unclear Boundaries:**
   - Card-related code scattered: `CardEditor.tsx`, `CardPreview.tsx` at root, `StepTabs.tsx`, `OptionalFieldGroup.tsx` in `components/`
   - Profile-related code scattered: `ProfileForm.tsx` in `components/`, `profileApi.ts` in `lib/`
   - Auth logic split: `auth/AuthButtons.tsx` and `hooks/useAuth.ts`

### 🟡 Medium Issues

4. **Organization:**
   - Domain-specific components in generic `components/` folder
   - Types at root level instead of co-located with features
   - Business logic in `lib/` instead of feature folders

5. **Component Size:**
   - `CardEditor.tsx` (518 lines) - Should be split into smaller components

6. **Unused Code:**
   - `components/AuthPanel.tsx` - Appears unused
   - Legacy pages: `ProfileSetupPage.tsx`, `TemplateSelectPage.tsx`, `CompletePage.tsx` - May be unused

### 🟢 Minor Issues

7. **Inconsistencies:**
   - Some files use direct `supabase` import, others use `useAuth` hook
   - Mixed patterns for error handling and loading states

---

## Recommendations

1. **Feature-based structure:** Group by domain (cards, profile, auth, onboarding)
2. **Shared layer:** Infrastructure (Supabase client), routing, common UI components
3. **Split god files:** Break down `AppPage.tsx` and `onboardingFlow.ts`
4. **Remove duplicates:** Clean up unused pages and components
5. **Co-locate types:** Move types next to their features

