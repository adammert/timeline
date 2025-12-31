import { describe, it, expect, beforeEach } from 'vitest';
import { Storage } from './storage';

describe('Storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should save and load content from localStorage', () => {
    const content = 'date: 2025-01-01\nTest content';
    Storage.saveToLocalStorage(content);
    const loaded = Storage.loadFromLocalStorage();
    expect(loaded).toBe(content);
  });

  it('should return default content if localStorage is empty', () => {
    const loaded = Storage.loadFromLocalStorage();
    expect(loaded).toContain('Willkommen zur Timeline');
  });

  it('should save and load theme', () => {
    Storage.saveTheme('dark');
    expect(Storage.loadTheme()).toBe('dark');
  });

  it('should return default theme "light"', () => {
    expect(Storage.loadTheme()).toBe('light');
  });

  describe('History', () => {
    it('should save to history and handle undo', () => {
      const state1 = 'state 1';
      const state2 = 'state 2';
      
      Storage.saveToHistory(state1);
      Storage.saveToHistory(state2);
      
      const history = Storage.getHistory();
      expect(history).toContain(state1);
      expect(history).toContain(state2);
      
      const undone = Storage.undo(state2);
      expect(undone).toBe(state1);
      
      expect(Storage.getHistory().length).toBe(1);
    });

    it('should not save duplicate consecutive states', () => {
      const state = 'duplicate';
      Storage.saveToHistory(state);
      Storage.saveToHistory(state);
      expect(Storage.getHistory().length).toBe(1);
    });
  });
});
