# Spec: Add Unit Tests for Core Modules

## Overview
This track focuses on improving the stability and maintainability of the Timeline Visualizer by introducing a comprehensive unit testing suite. The primary goal is to achieve high test coverage for the core logic modules: `parser.ts` and `storage.ts`.

## Requirements
- **Testing Framework:** Implement Vitest as the primary testing framework due to its seamless integration with Vite.
- **Parser Tests:**
    - Verify parsing of various date formats (ISO, German, Quartale, Monatsnamen).
    - Verify extraction of titles and event metadata.
    - Test edge cases like malformed dates or empty strings.
- **Storage Tests:**
    - Verify saving and loading from `localStorage`.
    - Test the Undo/Redo history logic.
    - Verify theme persistence.
- **Coverage Goal:** Aim for at least 80% code coverage for the targeted modules, as per the project workflow.

## Design
- Tests should be co-located or placed in a `tests/` directory (following project convention if discovered).
- Use mocks for `localStorage` and other browser APIs.
