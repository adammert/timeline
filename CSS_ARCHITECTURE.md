# CSS Architecture Documentation

## Overview

Timeline Visualizer v3.0 uses a **Tailwind CSS-first** architecture with minimal custom CSS. This document explains the CSS structure, conventions, and best practices.

## Architecture Layers

### 1. Tailwind Base Layer (`@tailwind base`)
- CSS resets and defaults
- Basic element styles
- Automatic browser normalization

### 2. Tailwind Components Layer (`@tailwind components`)
- Custom component classes
- Located in `src/styles/tailwind.css`
- Uses `@layer components` directive

### 3. Tailwind Utilities Layer (`@tailwind utilities`)
- Utility classes (margin, padding, colors, etc.)
- Generated dynamically by Tailwind

### 4. Custom Styles (`src/styles/styles.css`)
- Legacy-specific styles not covered by Tailwind
- Minimal: Only 48 lines (down from 1274)
- Should be avoided for new features

## File Structure

```
src/styles/
├── tailwind.css          # Tailwind components and custom utilities
├── styles.css            # Minimal custom CSS (legacy)
└── styles.css.backup     # Original CSS (archived)
```

### tailwind.css (138 lines)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom Scrollbar */
@layer utilities {
  .custom-scrollbar::-webkit-scrollbar { ... }
}

/* Syntax Highlighting Tokens */
@layer components {
  .token-keyword { @apply text-pink-400 font-medium; }
  .token-string { @apply text-purple-400; }
  /* ... */
}

/* Timeline Components */
@layer components {
  .timeline-line { @apply absolute left-6 ...; }
  .dashed-line { @apply absolute left-6 ...; }
  .timeline-item { @apply opacity-0 translate-y-5; }
  /* ... */
}
```

### styles.css (48 lines)

```css
/* Legacy class-specific colors */
.class-critical { color: #ef4444 !important; }
.class-warning { color: #f59e0b !important; }
/* ... */

/* State-specific styles */
#autosaveIndicator.show { opacity: 1; }
textarea.drag-over { ... }
textarea.highlight-scroll { ... }
```

## Tailwind Configuration

### tailwind.config.js

```javascript
export default {
  content: [
    "./index.html",
    "./presentation.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#6366f1',
        'background-light': '#f3f4f6',
        'background-dark': '#18181b',
        // ...
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow': '0 0 15px rgba(59, 130, 246, 0.5)',
        'glow-success': '0 0 15px rgba(34, 197, 94, 0.3)',
        'glow-danger': '0 0 15px rgba(239, 68, 68, 0.3)',
        'glow-warning': '0 0 15px rgba(245, 158, 11, 0.3)',
        'glow-purple': '0 0 15px rgba(168, 85, 247, 0.3)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
```

## Design Tokens

### Colors

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `primary` | #3B82F6 | #3B82F6 | Primary actions, links |
| `secondary` | #6366f1 | #6366f1 | Secondary elements |
| `background-light` | #f3f4f6 | - | Light mode background |
| `background-dark` | - | #18181b | Dark mode background |
| `surface-light` | #ffffff | - | Cards, panels (light) |
| `surface-dark` | - | #27272a | Cards, panels (dark) |
| `danger` | #ef4444 | #ef4444 | Errors, critical |
| `warning` | #f59e0b | #f59e0b | Warnings |
| `success` | #22c55e | #22c55e | Success states |
| `purple` | #a855f7 | #a855f7 | Meetings |

### Typography

| Token | Value | Usage |
|-------|-------|-------|
| `font-sans` | Inter | UI text |
| `font-mono` | JetBrains Mono | Code, editor |

### Spacing

Uses Tailwind's default spacing scale (0.25rem base):

| Class | Value | Example |
|-------|-------|---------|
| `p-1` | 0.25rem | `<div class="p-1">` |
| `p-2` | 0.5rem | `<div class="p-2">` |
| `p-4` | 1rem | `<div class="p-4">` |
| `p-6` | 1.5rem | `<div class="p-6">` |
| `p-8` | 2rem | `<div class="p-8">` |

### Shadows

| Class | Effect | Usage |
|-------|--------|-------|
| `shadow-sm` | Subtle | Cards |
| `shadow-md` | Medium | Modals |
| `shadow-lg` | Large | Dropdowns |
| `shadow-xl` | Extra large | Popups |
| `shadow-glow` | Blue glow | Primary buttons |
| `shadow-glow-*` | Contextual glow | Event cards |

## Component Patterns

### Button Styles

```html
<!-- Primary Button -->
<button class="bg-primary hover:bg-blue-600 text-white font-semibold py-2.5 px-4 rounded-lg shadow-glow transition-all focus:outline-none focus:ring-2 focus:ring-blue-300">
  Primary Action
</button>

<!-- Secondary Button -->
<button class="bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600 text-gray-700 dark:text-gray-200 px-3 py-1.5 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary">
  Secondary
</button>

<!-- Icon Button -->
<button class="p-2 rounded-lg text-gray-500 hover:text-primary hover:bg-blue-50 dark:hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary">
  <span class="material-icons-round" aria-hidden="true">icon_name</span>
</button>
```

### Card Styles

```html
<!-- Timeline Card -->
<div class="bg-white dark:bg-surface-dark rounded-xl p-5 border-l-4 border-primary shadow-md hover:shadow-xl dark:shadow-glow transition-all duration-300 relative overflow-hidden">
  <!-- Gradient overlay -->
  <div class="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none"></div>

  <!-- Content -->
  <div class="relative z-10">
    <!-- Card content here -->
  </div>
</div>
```

### Input Styles

```html
<!-- Text Input -->
<input
  type="text"
  class="w-full bg-gray-100 dark:bg-zinc-800 border-none rounded-md py-1.5 pl-8 text-sm text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary placeholder-gray-500"
  placeholder="Search..."
/>

<!-- Textarea -->
<textarea
  class="w-full bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-md p-4 font-mono text-sm focus:ring-2 focus:ring-primary"
></textarea>
```

## Dark Mode

### Implementation

Dark mode uses Tailwind's `class` strategy:

```html
<!-- Toggle dark mode by adding/removing 'dark' class on <html> -->
<html class="dark">
  <!-- All elements with dark: prefix will apply -->
  <div class="bg-white dark:bg-zinc-900">
    Dark mode content
  </div>
</html>
```

### Dark Mode Classes

| Pattern | Example | Description |
|---------|---------|-------------|
| `dark:bg-*` | `dark:bg-zinc-900` | Background colors |
| `dark:text-*` | `dark:text-gray-200` | Text colors |
| `dark:border-*` | `dark:border-zinc-700` | Border colors |
| `dark:hover:*` | `dark:hover:bg-zinc-800` | Hover states |

### TypeScript Integration

```typescript
// app.ts
private applyTheme(theme: ThemeMode): void {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  document.documentElement.setAttribute('data-theme', theme);
}
```

## Responsive Design

### Breakpoints

| Breakpoint | Min Width | Usage |
|------------|-----------|-------|
| `sm:` | 640px | Small tablets |
| `md:` | 768px | Tablets |
| `lg:` | 1024px | Desktops |
| `xl:` | 1280px | Large desktops |
| `2xl:` | 1536px | Extra large |

### Mobile-First Examples

```html
<!-- Full width on mobile, 5/12 on medium+ -->
<aside class="w-full md:w-5/12">
  Editor Panel
</aside>

<!-- Hide on mobile, show on medium+ -->
<button class="hidden md:block">
  Debug
</button>

<!-- Responsive padding -->
<div class="p-3 md:p-6">
  Content
</div>

<!-- Responsive text size -->
<h1 class="text-sm md:text-lg">
  Timeline Editor
</h1>
```

## Animations

### Transition Classes

```html
<!-- All transitions -->
<div class="transition-all duration-300">

<!-- Specific properties -->
<div class="transition-colors duration-200">
<div class="transition-transform duration-300">
<div class="transition-opacity duration-500">

<!-- Timing functions -->
<div class="ease-in">
<div class="ease-out">
<div class="ease-in-out">
```

### Transform Examples

```html
<!-- Scale on hover -->
<div class="transform hover:scale-110 transition-transform">

<!-- Translate on hover -->
<div class="transform hover:-translate-y-1 transition-transform">

<!-- Rotate -->
<div class="transform rotate-45">
```

### Custom Animations (tailwind.css)

```css
@layer components {
  .timeline-item {
    @apply opacity-0 translate-y-5;
    transition: opacity 0.6s cubic-bezier(0.5, 0, 0.25, 1),
                transform 0.6s cubic-bezier(0.5, 0, 0.25, 1);
  }

  .timeline-item.is-visible {
    @apply opacity-100 translate-y-0;
  }
}
```

## Accessibility

### Focus States

All interactive elements must have visible focus indicators:

```html
<button class="focus:outline-none focus:ring-2 focus:ring-primary">
  Accessible Button
</button>
```

### ARIA Labels

```html
<button aria-label="Close modal">
  <span class="material-icons-round" aria-hidden="true">close</span>
</button>

<input
  aria-label="Search timeline"
  aria-describedby="searchHint"
/>
```

## Performance Best Practices

### 1. Use Tailwind Utilities
✅ **Good**: `class="flex items-center gap-2"`
❌ **Bad**: Custom CSS for common layouts

### 2. Avoid !important
✅ **Good**: Proper specificity with Tailwind
❌ **Bad**: `.my-class { color: red !important; }`

### 3. Use @layer
✅ **Good**: `@layer components { .my-btn { ... } }`
❌ **Bad**: Styles outside layers

### 4. Minimize Custom CSS
- Use Tailwind utilities first
- Only add custom CSS when necessary
- Document all custom styles

### 5. PurgeCSS
Tailwind automatically removes unused styles in production:

```javascript
// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // Unused classes are automatically removed
}
```

## Migration from v2.x

### Before (Custom CSS)
```css
.timeline-item {
  position: relative;
  margin-bottom: 35px;
  padding-left: 55px;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
```

### After (Tailwind)
```html
<div class="timeline-item relative mb-9 pl-14 opacity-0 translate-y-5 transition-all duration-600">
  <!-- Content -->
</div>
```

## Debugging Tips

### 1. Use Browser DevTools
- Inspect elements to see applied Tailwind classes
- Check computed styles for actual values

### 2. Tailwind IntelliSense
- Install Tailwind CSS IntelliSense VSCode extension
- Get autocomplete and hover previews

### 3. JIT Mode
- Tailwind 3.x uses JIT (Just-In-Time) by default
- Arbitrary values: `w-[137px]`, `top-[117px]`

### 4. Debug Classes
```html
<!-- Temporary visual debugging -->
<div class="border-2 border-red-500">Debug Container</div>
```

## Common Issues

### Issue: Styles Not Applying
**Solution**: Check if class is in `content` array in tailwind.config.js

### Issue: Dark Mode Not Working
**Solution**: Ensure `darkMode: 'class'` in config and `dark` class on `<html>`

### Issue: Custom Colors Not Available
**Solution**: Extend theme in tailwind.config.js, not replace

### Issue: PurgeCSS Removing Needed Classes
**Solution**: Use safelist in config or avoid dynamic class names

## Resources

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Tailwind UI Components](https://tailwindui.com/)
- [Headless UI](https://headlessui.com/)
- [Tailwind Play](https://play.tailwindcss.com/)

## Changelog

- **v3.0.0** - Complete migration to Tailwind CSS
- **v2.0.1** - Custom CSS with CSS variables
- **v1.x** - Legacy CSS

---

**Last Updated**: 2025-12-18
**Maintained by**: Timeline Visualizer Team
