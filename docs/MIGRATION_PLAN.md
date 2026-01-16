# Migration Plan: Feature-Based Structure

## Proposed New Structure

```
src/
├── shared/
│   ├── infrastructure/
│   │   └── supabaseClient.ts          # Supabase client singleton
│   ├── routing/
│   │   └── routes.tsx                 # Route definitions (extracted from App.tsx)
│   ├── ui/
│   │   └── (empty for now - add truly generic components later)
│   └── types/
│       └── index.ts                   # Only truly shared types (if any)
│
├── features/
│   ├── auth/
│   │   ├── api/
│   │   │   └── authApi.ts            # Auth API calls (if needed)
│   │   ├── components/
│   │   │   └── AuthButtons.tsx       # OAuth login buttons
│   │   ├── hooks/
│   │   │   └── useAuth.ts            # Auth state hook
│   │   └── types.ts                  # Auth-related types
│   │
│   ├── profile/
│   │   ├── api/
│   │   │   └── profileApi.ts         # Profile CRUD operations
│   │   ├── components/
│   │   │   └── ProfileForm.tsx       # Profile editing form
│   │   ├── pages/
│   │   │   └── ProfileView.tsx       # Profile display (extracted from AppPage)
│   │   └── types.ts                  # Profile types
│   │
│   ├── cards/
│   │   ├── api/
│   │   │   └── cardsApi.ts           # Card CRUD operations (extracted from AppPage)
│   │   ├── components/
│   │   │   ├── CardEditor.tsx        # Card editing wizard
│   │   │   ├── CardPreview.tsx       # Card preview
│   │   │   ├── StepTabs.tsx          # Wizard step tabs
│   │   │   └── OptionalFieldGroup.tsx # Collapsible field group
│   │   ├── pages/
│   │   │   └── CardStudioPage.tsx    # Card list + editor (extracted from AppPage)
│   │   └── types.ts                  # CardData, FontFamilyOption
│   │
│   └── onboarding/
│       ├── components/
│       │   └── (onboarding-specific UI if needed)
│       ├── flow/
│       │   ├── onboardingFlow.ts     # Route resolution
│       │   ├── validation.ts         # Step validation logic
│       │   └── profileSetup.ts       # Profile setup helpers
│       ├── pages/
│       │   ├── OnboardingPage.tsx    # Initial onboarding
│       │   ├── TemplateSelectPage.tsx # Template selection
│       │   └── CompletePage.tsx       # Completion screen
│       └── types.ts                  # OnboardingStep, etc.
│
├── pages/
│   ├── LoginPage.tsx                 # Login page
│   ├── AuthCallback.tsx               # OAuth callback handler
│   └── AppPage.tsx                   # Main app layout (simplified)
│
├── App.tsx                           # Router setup (uses routes from shared/routing)
├── main.tsx                          # Entry point
└── index.css                         # Global styles
```

---

## Migration Plan (5 Steps)

### Step 1: Create New Folder Structure & Move Shared Infrastructure
**Goal:** Establish foundation without breaking imports

**Actions:**
1. Create `src/shared/infrastructure/` folder
2. Move `src/lib/supabaseClient.ts` → `src/shared/infrastructure/supabaseClient.ts`
3. Update all imports:
   - `src/lib/supabaseClient` → `src/shared/infrastructure/supabaseClient`
   - Files affected: ~15 files (all files importing supabaseClient)

**Import Updates:**
- `src/hooks/useAuth.ts`
- `src/auth/AuthButtons.tsx`
- `src/lib/profileApi.ts`
- `src/lib/onboardingFlow.ts`
- `src/pages/AuthCallback.tsx`
- `src/pages/AppPage.tsx`
- `src/pages/Onboarding.tsx`
- `src/pages/LoginPage.tsx`
- (and any others)

**Risk:** Low (single file move, straightforward find/replace)

---

### Step 2: Extract Card Feature
**Goal:** Group all card-related code together

**Actions:**
1. Create `src/features/cards/` structure:
   - `api/`, `components/`, `pages/`, `types.ts`
2. Move files:
   - `src/CardEditor.tsx` → `src/features/cards/components/CardEditor.tsx`
   - `src/CardPreview.tsx` → `src/features/cards/components/CardPreview.tsx`
   - `src/components/StepTabs.tsx` → `src/features/cards/components/StepTabs.tsx`
   - `src/components/OptionalFieldGroup.tsx` → `src/features/cards/components/OptionalFieldGroup.tsx`
   - `src/types.ts` (CardData, FontFamilyOption) → `src/features/cards/types.ts`
3. Extract card API from `AppPage.tsx`:
   - Create `src/features/cards/api/cardsApi.ts` with functions:
     - `getMyCards()`, `createCard()`, `updateCard()`, `deleteCard()`
   - Move card CRUD logic from `AppPage.tsx` to this file
4. Update imports:
   - `src/pages/AppPage.tsx`: Update CardEditor, CardPreview imports
   - `src/features/cards/components/CardEditor.tsx`: Update relative imports for StepTabs, OptionalFieldGroup, CardPreview, types

**Import Updates:**
- `src/pages/AppPage.tsx`:
  - `import { CardEditor } from '../CardEditor'` → `import { CardEditor } from '../features/cards/components/CardEditor'`
  - `import type { CardData } from '../types'` → `import type { CardData } from '../features/cards/types'`
- `src/features/cards/components/CardEditor.tsx`:
  - `import { CardPreview } from './CardPreview'` (same folder, no change)
  - `import { StepTabs } from './components/StepTabs'` → `import { StepTabs } from './StepTabs'` (same folder)
  - `import type { CardData } from './types'` → `import type { CardData } from '../types'`

**Risk:** Medium (multiple files, need to update relative imports carefully)

---

### Step 3: Extract Profile Feature
**Goal:** Group all profile-related code together

**Actions:**
1. Create `src/features/profile/` structure:
   - `api/`, `components/`, `pages/`, `types.ts`
2. Move files:
   - `src/lib/profileApi.ts` → `src/features/profile/api/profileApi.ts`
   - `src/components/ProfileForm.tsx` → `src/features/profile/components/ProfileForm.tsx`
3. Extract profile display from `AppPage.tsx`:
   - Create `src/features/profile/pages/ProfileView.tsx`
   - Move profile display section from `AppPage.tsx` to this component
4. Update imports:
   - All files importing `profileApi` or `ProfileForm`
   - `AppPage.tsx` to use new `ProfileView` component

**Import Updates:**
- `src/pages/AppPage.tsx`:
  - `import { getMyProfile, type Profile } from '../lib/profileApi'` → `import { getMyProfile, type Profile } from '../features/profile/api/profileApi'`
  - `import { ProfileForm } from '../components/ProfileForm'` → `import { ProfileForm } from '../features/profile/components/ProfileForm'`
- `src/pages/Onboarding.tsx`:
  - `import { getMyProfile, upsertMyProfile, type Profile } from '../lib/profileApi'` → `import { getMyProfile, upsertMyProfile, type Profile } from '../features/profile/api/profileApi'`
- `src/pages/AuthCallback.tsx`:
  - `import { getMyProfile } from '../lib/profileApi'` → `import { getMyProfile } from '../features/profile/api/profileApi'`
- `src/lib/onboardingFlow.ts`:
  - `import { getMyProfile, upsertMyProfile } from './profileApi'` → `import { getMyProfile, upsertMyProfile } from '../features/profile/api/profileApi'`
- `src/features/profile/components/ProfileForm.tsx`:
  - `import type { Profile } from '../lib/profileApi'` → `import type { Profile } from '../api/profileApi'`
  - `import { upsertMyProfile } from '../lib/profileApi'` → `import { upsertMyProfile } from '../api/profileApi'`

**Risk:** Medium (multiple imports, profile display extraction from AppPage)

---

### Step 4: Extract Auth Feature & Refactor Onboarding
**Goal:** Consolidate auth code and organize onboarding flow

**Actions:**
1. Create `src/features/auth/` structure:
   - `components/`, `hooks/`, `types.ts`
2. Move files:
   - `src/auth/AuthButtons.tsx` → `src/features/auth/components/AuthButtons.tsx`
   - `src/hooks/useAuth.ts` → `src/features/auth/hooks/useAuth.ts`
3. Update imports:
   - All files importing from `auth/` or `hooks/useAuth`
4. Create `src/features/onboarding/` structure:
   - `flow/`, `pages/`, `types.ts`
5. Split `lib/onboardingFlow.ts`:
   - `src/features/onboarding/flow/onboardingFlow.ts` - Route resolution
   - `src/features/onboarding/flow/validation.ts` - `isProfileComplete`, `isTemplateSelected`
   - `src/features/onboarding/flow/profileSetup.ts` - `ensureProfileRow`, `maybeAdvanceOnboardingStep`
6. Move onboarding pages:
   - `src/pages/Onboarding.tsx` → `src/features/onboarding/pages/OnboardingPage.tsx`
   - `src/pages/TemplateSelectPage.tsx` → `src/features/onboarding/pages/TemplateSelectPage.tsx`
   - `src/pages/CompletePage.tsx` → `src/features/onboarding/pages/CompletePage.tsx`
7. Update imports in all affected files

**Import Updates:**
- `src/pages/AppPage.tsx`:
  - `import { useAuth } from '../hooks/useAuth'` → `import { useAuth } from '../features/auth/hooks/useAuth'`
  - `import { SignOutButton } from '../auth/AuthButtons'` → `import { SignOutButton } from '../features/auth/components/AuthButtons'`
- `src/pages/LoginPage.tsx`:
  - `import { AuthButtons } from '../auth/AuthButtons'` → `import { AuthButtons } from '../features/auth/components/AuthButtons'`
- `src/pages/Onboarding.tsx`:
  - `import { useAuth } from '../hooks/useAuth'` → `import { useAuth } from '../features/auth/hooks/useAuth'`
- All files importing `onboardingFlow`:
  - `import { ... } from '../lib/onboardingFlow'` → `import { ... } from '../features/onboarding/flow/onboardingFlow'`
  - `import { ... } from '../features/onboarding/flow/validation'`
  - `import { ... } from '../features/onboarding/flow/profileSetup'`

**Risk:** High (many imports, splitting onboardingFlow.ts requires careful dependency management)

---

### Step 5: Clean Up & Finalize
**Goal:** Remove duplicates, update routing, simplify AppPage

**Actions:**
1. **Remove duplicate/legacy files:**
   - Delete `src/pages/OnboardingPage.tsx` (not in routes, legacy)
   - Delete `src/pages/StudioPage.tsx` (not in routes, legacy, uses broken AuthPanel)
   - Delete `src/pages/ProfileSetupPage.tsx` (not in routes, legacy)
   - Delete `src/pages/TemplateSelectPage.tsx` (not in routes, legacy)
   - Delete `src/pages/CompletePage.tsx` (not in routes, legacy)
   - Delete `src/components/AuthPanel.tsx` (broken, uses non-existent API)
   - Delete `src/lib/` folder (now empty after moves)

2. **Extract routing:**
   - Create `src/shared/routing/routes.tsx`
   - Move route definitions from `App.tsx` to `routes.tsx`
   - Update `App.tsx` to import and use routes

3. **Simplify AppPage:**
   - Extract card list/management to `src/features/cards/pages/CardStudioPage.tsx`
   - Extract profile display to `src/features/profile/pages/ProfileView.tsx`
   - `AppPage.tsx` becomes a layout component that composes these

4. **Update all remaining imports:**
   - Verify all imports work
   - Update any absolute imports if using path aliases

**Import Updates:**
- `src/App.tsx`:
  - Import routes from `shared/routing/routes.tsx`
- `src/pages/AppPage.tsx`:
  - Import `CardStudioPage` from `features/cards/pages/CardStudioPage`
  - Import `ProfileView` from `features/profile/pages/ProfileView`

**Risk:** Low (cleanup, but need to verify no active routes are deleted)

---

## Verification Checklist

After each step:
- [ ] All imports resolve correctly
- [ ] TypeScript compiles without errors
- [ ] Application runs (`npm run dev`)
- [ ] No broken routes
- [ ] No console errors

After all steps:
- [ ] All duplicate files removed
- [ ] All legacy code removed
- [ ] Folder structure matches proposal
- [ ] No circular dependencies
- [ ] All features are self-contained

---

## Path Alias Configuration (Optional Enhancement)

Consider adding to `vite.config.mts`:
```typescript
resolve: {
  alias: {
    '@shared': path.resolve(__dirname, './src/shared'),
    '@features': path.resolve(__dirname, './src/features'),
    '@pages': path.resolve(__dirname, './src/pages'),
  }
}
```

This would allow imports like:
- `import { supabase } from '@shared/infrastructure/supabaseClient'`
- `import { CardEditor } from '@features/cards/components/CardEditor'`

But this is optional - relative imports work fine too.

