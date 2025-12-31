# Plan: Add Unit Tests for Core Modules

## Phase 1: Setup Testing Environment
- [x] Task: Install Vitest and related dependencies (`npm install -D vitest @vitest/coverage-v8`).
- [x] Task: Configure Vitest in `vite.config.ts` or a dedicated `vitest.config.ts`.
- [x] Task: Update `package.json` with a `test` script.
- [x] Task: Conductor - User Manual Verification 'Setup Testing Environment' (Protocol in workflow.md)

## Phase 2: Parser Unit Tests
- [x] Task: Create `src/modules/parser.test.ts`.
- [x] Task: Write tests for `extractTitleFromMarkdown`.
- [x] Task: Write tests for `parseDate` (covering all supported formats).
- [x] Task: Write tests for `parseEvents`.
- [x] Task: Conductor - User Manual Verification 'Parser Unit Tests' (Protocol in workflow.md)

## Phase 3: Storage Unit Tests
- [x] Task: Create `src/modules/storage.test.ts`.
- [x] Task: Implement `localStorage` mock for the test environment.
- [x] Task: Write tests for `saveToLocalStorage` and `loadFromLocalStorage`.
- [x] Task: Write tests for `saveToHistory` and `undo`/`redo` logic.
- [x] Task: Conductor - User Manual Verification 'Storage Unit Tests' (Protocol in workflow.md)

## Phase 4: Final Verification and Coverage
- [x] Task: Run tests with coverage reporting.
- [x] Task: Ensure coverage for `parser.ts` and `storage.ts` exceeds 80%.
- [x] Task: Conductor - User Manual Verification 'Final Verification and Coverage' (Protocol in workflow.md)
