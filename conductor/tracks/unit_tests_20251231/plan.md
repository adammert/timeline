# Plan: Add Unit Tests for Core Modules

## Phase 1: Setup Testing Environment
- [ ] Task: Install Vitest and related dependencies (`npm install -D vitest @vitest/coverage-v8`).
- [ ] Task: Configure Vitest in `vite.config.ts` or a dedicated `vitest.config.ts`.
- [ ] Task: Update `package.json` with a `test` script.
- [ ] Task: Conductor - User Manual Verification 'Setup Testing Environment' (Protocol in workflow.md)

## Phase 2: Parser Unit Tests
- [ ] Task: Create `src/modules/parser.test.ts`.
- [ ] Task: Write tests for `extractTitleFromMarkdown`.
- [ ] Task: Write tests for `parseDate` (covering all supported formats).
- [ ] Task: Write tests for `parseEvents`.
- [ ] Task: Conductor - User Manual Verification 'Parser Unit Tests' (Protocol in workflow.md)

## Phase 3: Storage Unit Tests
- [ ] Task: Create `src/modules/storage.test.ts`.
- [ ] Task: Implement `localStorage` mock for the test environment.
- [ ] Task: Write tests for `saveToLocalStorage` and `loadFromLocalStorage`.
- [ ] Task: Write tests for `saveToHistory` and `undo`/`redo` logic.
- [ ] Task: Conductor - User Manual Verification 'Storage Unit Tests' (Protocol in workflow.md)

## Phase 4: Final Verification and Coverage
- [ ] Task: Run tests with coverage reporting.
- [ ] Task: Ensure coverage for `parser.ts` and `storage.ts` exceeds 80%.
- [ ] Task: Conductor - User Manual Verification 'Final Verification and Coverage' (Protocol in workflow.md)
