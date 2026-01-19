# Changelog

All notable changes to the Timeline Visualizer project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2025-12-18 - Tailwind CSS Redesign Edition 🎨

### 🎉 Major Changes

This release represents a complete visual and architectural redesign of the Timeline Visualizer, migrating from custom CSS to Tailwind CSS while maintaining all existing functionality.

### ✨ Added

#### Design System
- **Tailwind CSS Integration** - Modern utility-first CSS framework
- **Material Icons Round** - Beautiful icon system for all UI elements
- **Google Fonts** - Inter for UI, JetBrains Mono for code editor
- **Dark Mode System** - Fully responsive dark/light theme with system preference detection
- **Custom Color Palette** - Extended with semantic colors (primary, secondary, success, danger, warning, purple)
- **Glow Effects** - Contextual glow shadows for different event types
- **Gradient Overlays** - Subtle gradients on timeline cards

#### Timeline Visualization
- **Modernized Cards** - Rounded corners (rounded-xl), improved shadows
- **Enhanced Date Badges** - Modern pill-style badges with better contrast
- **Duration Badges** - Visual indicators for events with time spans
- **Timeline Dots** - Scale animation on hover for better interactivity
- **Connecting Lines** - Visual connection between duration events
- **Smooth Animations** - Fade-in and slide-up animations for timeline items
- **Contextual Colors** - Class-specific colors and glow effects:
  - Critical (Red): Important/urgent events
  - Warning (Amber): Caution events
  - Success (Green): Positive outcomes
  - Meeting (Purple): Meeting/discussion events
  - Work (Blue): Work/task events

#### Editor Experience
- **Syntax Highlighting** - Real-time highlighting for timeline markdown
  - Keywords (date:, class:, etc.) in pink
  - Strings in purple
  - Dates in emerald
  - Headers in blue
  - Comments in gray
- **Line Numbers** - Visual line number gutter
- **Overlay System** - Transparent textarea with syntax-highlighted overlay
- **Improved Focus States** - Better keyboard navigation with ring indicators

#### User Interface
- **Responsive Design** - Mobile-first design with breakpoints
  - Mobile: Full-width editor panel
  - Desktop: Split view with resizable panels
- **Accessibility Improvements**:
  - ARIA labels for all interactive elements
  - Focus indicators with ring-2 style
  - Semantic HTML (header, nav, main)
  - Screen reader support with aria-live regions
  - Keyboard navigation improvements
- **Icon Buttons** - Material Icons for all toolbar actions
- **Improved Search** - Icon-enhanced search input with clear button
- **Filter UI** - Modernized filter dropdown with badges
- **Export Buttons** - Grid layout with icons for all export options

#### Dark Mode
- **System Preference Detection** - Automatically detects user's OS theme preference
- **Manual Toggle** - Sun/moon icon button to switch themes
- **Persistent State** - Theme preference saved to LocalStorage
- **Live Updates** - Smooth transitions between themes (duration-200)
- **Comprehensive Coverage** - All UI elements support dark mode

#### Performance
- **CSS Bundle Reduction** - 96% reduction in custom CSS (28KB → 1.1KB)
- **Build Optimization** - Tailwind's purge removes unused styles
- **TypeScript Performance** - Improved type checking and IntelliSense
- **Lazy Loading** - Optimized asset loading with Vite

### 🔧 Changed

#### Architecture
- **CSS Migration** - Migrated from 1274 lines of custom CSS to 186 lines (48 custom + 138 Tailwind components)
- **Utility-First Approach** - Replaced custom classes with Tailwind utilities
- **Component Structure** - Reorganized with Tailwind's @layer system
- **Color System** - From CSS variables to Tailwind's color palette
- **Typography** - From custom font definitions to Tailwind's typography plugin
- **Spacing** - From custom variables to Tailwind's spacing scale

#### UI Components
- **Buttons** - Redesigned with Tailwind classes and Material Icons
- **Modals** - Modern card-style modals with improved accessibility
- **Forms** - Tailwind Forms plugin for consistent input styling
- **Cards** - Timeline cards with border-l-4 accent and shadows
- **Badges** - Pill-style badges with rounded-full and proper padding

#### Development
- **Build System** - Vite 7.3.0 for faster builds
- **Node.js Requirement** - Updated to Node.js 20.19+ or 22.12+
- **TypeScript** - Full TypeScript integration maintained
- **Module System** - ESM-based architecture

### 🐛 Fixed
- **Focus States** - Improved keyboard navigation accessibility
- **Color Contrast** - Enhanced contrast for better readability
- **Mobile Layout** - Fixed responsive breakpoints for small screens
- **Dark Mode Transitions** - Smooth theme switching without flickering
- **Icon Alignment** - Consistent icon sizing across all buttons

### 🗑️ Deprecated
- **Legacy CSS Classes** - Old custom classes replaced with Tailwind utilities
- **CSS Variables** - Replaced with Tailwind's configuration system
- **Custom Animations** - Migrated to Tailwind's transition utilities

### 📦 Dependencies

#### Added
- `tailwindcss` (3.4.17) - Core Tailwind CSS framework
- `@tailwindcss/forms` (0.5.9) - Form styling plugin
- `@tailwindcss/typography` (0.5.16) - Typography plugin
- `postcss` (8.5.0) - PostCSS for Tailwind processing
- `autoprefixer` (10.4.20) - CSS vendor prefixing

#### Updated
- `vite` - Updated to v7.3.0
- `typescript` - Maintained current version
- All dev dependencies updated to latest compatible versions

### 📚 Documentation
- **CHANGELOG.md** - This changelog
- **REDESIGN_PLAN.md** - Complete redesign documentation with all phases
- **CSS Architecture** - Documented new Tailwind-based structure
- **Migration Notes** - Guide for understanding the new system

### 🎯 Breaking Changes

⚠️ **This is a major version release with breaking changes:**

1. **CSS Classes**: Custom CSS classes have been replaced with Tailwind utilities
2. **HTML Structure**: Updated to use semantic HTML5 elements
3. **Node.js Version**: Requires Node.js 20.19+ or 22.12+ (was 18.x)
4. **Build Process**: Now uses Tailwind's JIT compiler via PostCSS

### 📈 Performance Improvements
- **CSS Bundle**: 96% smaller custom CSS file
- **Initial Load**: Faster due to optimized CSS
- **Build Time**: Improved with Vite 7 and Tailwind JIT
- **Runtime**: Smoother animations with GPU-accelerated transforms

### 🔒 Security
- All dependencies updated to latest secure versions
- No security vulnerabilities in dependency tree

### 🙏 Credits
- Design inspired by modern web applications and Tailwind UI
- Icons from Google Material Icons Round
- Fonts from Google Fonts (Inter, JetBrains Mono)

---

## [2.0.1] - Previous Release

### Fixed
- Critical bug fixes
- Code quality improvements

## [2.0.0] - Previous Release

### Added
- TypeScript integration
- Modular architecture
- Image management system

---

For older versions, see the git commit history.

## Links
- [Repository](https://github.com/your-username/timeline-visualizer)
- [Issues](https://github.com/your-username/timeline-visualizer/issues)
- [Documentation](./help.md)
