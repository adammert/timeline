# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Timeline Visualizer is a TypeScript web application for creating interactive timeline visualizations from markdown input. Features include dark mode, swimlane views, multiple export formats (HTML, PNG, PDF, Markdown), and image embedding.

## Commands

```bash
npm run dev              # Start Vite dev server (port 3000)
npm run build            # TypeScript + Vite production build
npm run lint             # ESLint check
npm run format           # Prettier formatting
npm run type-check       # TypeScript validation
npm run test             # Vitest test suite
npm run test:coverage    # Tests with coverage report
```

## Architecture

### Core Modules (`src/`)

- **main.ts** - Entry point, initializes `TimelineApp` on DOMContentLoaded. **IMPORTANT: App initialization MUST only happen here, not in app.ts**
- **app.ts** - Main `TimelineApp` class orchestrating all modules, handles DOM, events, theme, autosave
- **parser.ts** - Converts markdown to `TimelineEvent[]`, parses dates (ISO, German `DD.MM.YYYY`, quarters, month names)
- **renderer.ts** - Renders events to DOM, supports standard and swimlane grid layouts, uses IntersectionObserver for animations
- **storage.ts** - LocalStorage wrapper (instance methods, not static) for persistence
- **export.ts** - Multi-format export, streamlined markdown+images loading (file picker → auto-load images from `images/` subfolder)
- **images.ts** - IndexedDB-based image storage, drag-drop and paste support

### Processing Pipeline

```
Markdown → Parser.extractTitle → Parser.parseEvents → Renderer → DOM
```

### Event Format

```markdown
date: 2025-01-15
end_date: 2025-01-20
group: Team A
class: critical|warning|success|meeting|work
## Event Title
Markdown content
---
```

### Styling

- **Tailwind-first** with custom components in `src/styles/tailwind.css`
- Dark mode via `dark:` class prefixes
- Event colors: critical (red), warning (amber), success (green), meeting (purple), work (blue)

## Testing

Tests use Vitest with jsdom. Test files are in `src/modules/` with `.test.ts` suffix but import from parent (`../parser`, `../storage`). Run single test file:

```bash
npx vitest src/modules/parser.test.ts
```

## Entry Points

- `index.html` - Main editor application
- `presentation.html` - Presentation/slideshow mode

## Keyboard Shortcuts

Ctrl+S (save), Ctrl+Enter (presentation), Ctrl+F (search), Ctrl+Z/Y (undo/redo), Ctrl+V (paste image)

## Development Workflow

Per `RULES_OF_ENGAGEMENT.md`: Read `backlog.md` and `progress_log.md` before starting work. Work on one feature at a time and update both files when done.
