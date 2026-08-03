# PRD — Detergent Formulator Pro (Foundation)

## Overview
Detergent Formulator Pro is a professional cross-platform (iOS, Android, Web/PWA) application for detergent chemists to author, validate, analyze, and archive their formulations. This iteration ships the **foundation only**: theming, navigation, and empty-scaffold pages for all planned features. No chemistry calculations or fake data.

## Tech Stack
- Expo SDK 54 + expo-router (file-based routing, works on iOS, Android, and Web)
- React 19 + React Native 0.81 + React Native Web
- react-native-reanimated for the mobile drawer animation
- @expo/vector-icons (Feather set)
- AsyncStorage for theme persistence

## Design System
Sourced from `/app/design_guidelines.json` — "iOS-Native Clean, adapted for a clinical lab tool" with a Slate & Emerald palette.
- Brand: Emerald `#059669` (light) / `#10B981` (dark)
- Surfaces: `#FFFFFF` / `#F3F4F6` (light), `#0B111C` / `#111827` (dark)
- Spacing scale 4–48, radius scale 6/12/20/pill
- Tokens live in `/app/frontend/src/theme/tokens.ts`; provider in `/app/frontend/src/theme/ThemeContext.tsx`

## Navigation Architecture
Per explicit user request: **NO bottom tabs.** Left drawer only.
- **Desktop (≥1024px)**: permanent left sidebar (280px), always visible
- **Mobile / Tablet (<1024px)**: hamburger toggles a slide-in drawer with dimmed backdrop
- Custom drawer implementation (Modal + Reanimated) — no extra native library required, works on web too
- Top app bar: hamburger (mobile only), breadcrumb + page title, search icon, theme toggle, avatar

## Pages (all empty scaffolds)
| Route | Purpose |
|---|---|
| `/` — Dashboard | Welcome header, 4 stat tiles, quick-action grid, recent-activity empty state |
| `/builder` — Formula Builder | Empty state, CTA "Add first ingredient" |
| `/checker` — Formula Checker | Empty state, CTA "Select a formula" |
| `/analyzer` — Formula Analyzer | Empty state, CTA "Choose a formula" |
| `/ingredients` — Ingredient Library | Empty state, CTA "Add ingredient" |
| `/library` — Formula Library | Empty state, CTA "Go to Builder" |
| `/ai-expert` — AI Formula Expert | Empty state, CTA "Start a conversation" |
| `/reports` — PDF Reports | Empty state, CTA "Choose a template" |
| `/settings` — Settings | Grouped list: Appearance (Dark Mode switch), Preferences, About |

## Backend
Kept as-is (starter FastAPI + Mongo). No new endpoints — foundation only.

## Accepted Constraints / Non-Goals
- No chemistry math, no seed data, no PDF generation yet
- No auth, no API integrations (Emergent LLM, etc.) yet — will be added in later iterations
- PWA install manifest works via Expo web output; installability comes for free from Expo web

## File Map
```
/app/frontend/
├── app/
│   ├── _layout.tsx           # ThemeProvider + SafeArea + AppShell + Slot
│   ├── index.tsx             # Dashboard
│   ├── builder.tsx
│   ├── checker.tsx
│   ├── analyzer.tsx
│   ├── ingredients.tsx
│   ├── library.tsx
│   ├── ai-expert.tsx
│   ├── reports.tsx
│   └── settings.tsx
└── src/
    ├── theme/
    │   ├── tokens.ts
    │   └── ThemeContext.tsx
    ├── nav/
    │   └── routes.ts
    └── components/
        ├── AppShell.tsx      # responsive shell (permanent sidebar vs drawer)
        ├── Sidebar.tsx
        ├── TopAppBar.tsx
        └── ScreenScaffold.tsx  # ScreenScaffold + EmptyState + Card
```

## Next Action Items
- Chemistry calculations & data models for Builder / Checker / Analyzer
- Ingredient database seed + search
- AI Formula Expert integration (LLM)
- PDF report generation
- Formula persistence (Mongo collections + CRUD APIs)
- Search bar in top app bar
- Optional: mobile PWA install prompts + service worker tuning
