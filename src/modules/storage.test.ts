import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Storage } from '../storage';

// Mock DOM elements
const mockIndicator = {
  classList: {
    add: vi.fn(),
    remove: vi.fn(),
  },
};

describe('Storage', () => {
  let storage: Storage;

  beforeEach(() => {
    localStorage.clear();
    storage = new Storage();
    vi.spyOn(document, 'getElementById').mockReturnValue(mockIndicator as any);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should save and load content from localStorage', () => {
    const content = 'date: 2025-01-01\nTest content';
    storage.saveToLocalStorage(content);
    const loaded = storage.loadFromLocalStorage();
    expect(loaded).toBe(content);
  });

  it('should save and load theme', () => {
    storage.saveTheme('dark');
    expect(storage.loadTheme()).toBe('dark');
  });

  it('should return light theme by default when no preference set', () => {
    // Mock matchMedia to return light preference
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    });

    expect(storage.loadTheme()).toBe('light');
  });

  it('should respect system dark theme preference', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockReturnValue({ matches: true }),
    });

    expect(storage.loadTheme()).toBe('dark');
  });

  describe('History', () => {
    it('should save to history', () => {
      const state1 = 'state 1';
      const state2 = 'state 2';

      storage.saveToHistory(state1);
      storage.saveToHistory(state2);

      // Verify by checking localStorage
      const saved = localStorage.getItem('timeline_history');
      expect(saved).not.toBeNull();
      const history = JSON.parse(saved!);
      expect(history).toContain(state1);
      expect(history).toContain(state2);
    });

    it('should not save duplicate consecutive states', () => {
      const state = 'duplicate';
      storage.saveToHistory(state);
      storage.saveToHistory(state);

      const saved = localStorage.getItem('timeline_history');
      const history = JSON.parse(saved!);
      expect(history.length).toBe(1);
    });
  });

  describe('Swimlane Preference', () => {
    it('should save and load swimlane preference', () => {
      storage.saveSwimlanePreference(true);
      expect(storage.loadSwimlanePreference()).toBe(true);
    });

    it('should return false by default', () => {
      expect(storage.loadSwimlanePreference()).toBe(false);
    });

    it('should detect if preference exists', () => {
      expect(storage.hasSwimlanePreference()).toBe(false);
      storage.saveSwimlanePreference(true);
      expect(storage.hasSwimlanePreference()).toBe(true);
    });
  });
});
