# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start development server
npm run build     # Production build
npm run lint      # ESLint
npm run slicemachine  # Prismic Slice Machine UI
```

Path alias `@/*` maps to `./src/*`.

## Architecture

**Cortex** is an offline-first student study app built with Next.js 15 (App Router), React 19, Tiptap v3, TailwindCSS 4, and Supabase (configured but not active in core flow). Prismic CMS is set up for marketing pages only.

### Persistence Model

All core app data is stored in **browser localStorage**, namespaced by user ID:

- User ID: `cortex:userId` → currently hardcoded to `"local-user"` (no real auth yet)
- Onboarding data: `cortex:users:{userId}:onboarding:v1`
- Notes per class: `cortex:users:{userId}:classes:{classId}:notes:v1`
- Flashcards per note: `cortex:notes:{noteId}:flashcards:v1`

The main localStorage API is in `src/lib/storage.ts` (`NoteRow` type, CRUD for notes). Note-specific helpers are in `src/lib/notes/storage.ts`.

### Auth Flow

`src/app/page.tsx` checks `cortex:userId` in localStorage. `src/app/login/page.tsx` creates `"local-user"` locally and redirects to `/onboarding` (first time) or `/dashboard`.

### Onboarding

Two-step flow in `src/app/onboarding/`: education level (HS grade + school, or college + major) → class selection. Class lists by grade and college subjects are in `src/features/onboarding/constants.ts`. College name suggestions come from `/api/colleges`.

### Note Editor

`src/app/note/[id]/NoteClient.tsx` is the main editor — Tiptap with StarterKit, color, font size, underline, and custom collapse extensions (`src/components/editor/`). Features: debounced auto-save, outline tree from headings, and flashcard generation via `/api/flashcards`.

### Flashcard API

`src/app/api/flashcards/route.ts` is currently a stub that splits note text into sentence-based recall cards. It's meant to be replaced with a real AI call while preserving the output contract: `{ front, back, sources: [{ quote }] }[]`.

### Layout & Theming

Dark theme throughout: bg `#070a0a`, text `#ecfeff`, accent green `#16a34a`. `src/components/DashboardLayout.tsx` wraps all authenticated pages with a 260px fixed sidebar (`src/components/sidebar.tsx`) + main content area.
