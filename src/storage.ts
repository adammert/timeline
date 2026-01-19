/**
 * LocalStorage Management Module
 */

import { STORAGE_KEYS, TIMING, HISTORY, TEMPLATES } from './config';
import type { ThemeMode } from './types';

export class Storage {
  private undoHistory: string[] = [];
  private redoHistory: string[] = [];
  private isUndoRedoAction = false;

  /**
   * Save content to LocalStorage
   */
  saveToLocalStorage(content: string): void {
    try {
      localStorage.setItem(STORAGE_KEYS.AUTOSAVE, content);
      localStorage.setItem(STORAGE_KEYS.AUTOSAVE_TIMESTAMP, new Date().toISOString());
      this.showAutosaveIndicator();
    } catch (e) {
      console.error('LocalStorage save failed:', e);
    }
  }

  /**
   * Load content from LocalStorage
   */
  loadFromLocalStorage(): string {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUTOSAVE);
      const timestamp = localStorage.getItem(STORAGE_KEYS.AUTOSAVE_TIMESTAMP);

      if (saved) {
        if (timestamp) {
          const date = new Date(timestamp);
          console.log('Loaded from autosave:', date.toLocaleString());
        }
        return saved;
      } else {
        // Return default template if nothing saved
        return TEMPLATES.project?.content || '';
      }
    } catch (e) {
      console.error('LocalStorage load failed:', e);
      return TEMPLATES.project?.content || '';
    }
  }

  /**
   * Show autosave indicator
   */
  private showAutosaveIndicator(): void {
    const indicator = document.getElementById('autosaveIndicator');
    if (indicator) {
      indicator.classList.add('show');
      setTimeout(() => {
        indicator.classList.remove('show');
      }, TIMING.AUTOSAVE_INDICATOR_DURATION);
    }
  }

  /**
   * Save current state to history
   */
  saveToHistory(currentValue: string): void {
    if (this.isUndoRedoAction) return;

    if (
      this.undoHistory.length > 0 &&
      this.undoHistory[this.undoHistory.length - 1] === currentValue
    ) {
      return;
    }

    this.undoHistory.push(currentValue);
    this.redoHistory = [];

    if (this.undoHistory.length > HISTORY.MAX_SIZE) {
      this.undoHistory.shift();
    }

    try {
      localStorage.setItem(
        STORAGE_KEYS.HISTORY,
        JSON.stringify(this.undoHistory.slice(-HISTORY.SAVE_SIZE))
      );
    } catch (e) {
      console.error('History save failed:', e);
    }
  }

  /**
   * Load history from LocalStorage
   */
  loadHistory(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (saved) {
        this.undoHistory = JSON.parse(saved);
      }
    } catch (e) {
      console.error('History load failed:', e);
    }
  }

  /**
   * Undo last change
   */
  undo(markdownInput: HTMLTextAreaElement, parseCallback?: () => void): void {
    if (this.undoHistory.length < 2) return;

    this.isUndoRedoAction = true;

    const current = this.undoHistory.pop();
    if (current) {
      this.redoHistory.push(current);
    }

    const previous = this.undoHistory[this.undoHistory.length - 1];
    if (previous) {
      markdownInput.value = previous;
    }

    if (parseCallback) parseCallback();

    setTimeout(() => {
      this.isUndoRedoAction = false;
    }, 100);
  }

  /**
   * Redo last undone change
   */
  redo(markdownInput: HTMLTextAreaElement, parseCallback?: () => void): void {
    if (this.redoHistory.length === 0) return;

    this.isUndoRedoAction = true;

    const next = this.redoHistory.pop();
    if (next) {
      this.undoHistory.push(next);
      markdownInput.value = next;
    }

    if (parseCallback) parseCallback();

    setTimeout(() => {
      this.isUndoRedoAction = false;
    }, 100);
  }

  /**
   * Save theme preference
   */
  saveTheme(theme: ThemeMode): void {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch (e) {
      console.error('Theme save failed:', e);
    }
  }

  /**
   * Load theme preference (respects system preference if no user preference set)
   */
  loadTheme(): ThemeMode {
    try {
      const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);

      // If user has explicitly set a theme, use it
      if (savedTheme) {
        return savedTheme as ThemeMode;
      }

      // Otherwise, check system preference
      return this.getSystemThemePreference();
    } catch (e) {
      console.error('Theme load failed:', e);
      return this.getSystemThemePreference();
    }
  }

  /**
   * Get system theme preference (prefers-color-scheme)
   */
  getSystemThemePreference(): ThemeMode {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  }

  /**
   * Check if user has explicitly set a theme preference
   */
  hasThemePreference(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEYS.THEME) !== null;
    } catch (e) {
      return false;
    }
  }

  /**
   * Save swimlane preference
   */
  saveSwimlanePreference(preference: boolean): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SWIMLANE, JSON.stringify(preference));
    } catch (e) {
      console.error('Swimlane preference save failed:', e);
    }
  }

  /**
   * Load swimlane preference
   */
  loadSwimlanePreference(): boolean {
    try {
      const preference = localStorage.getItem(STORAGE_KEYS.SWIMLANE);
      return preference ? JSON.parse(preference) : false;
    } catch (e) {
      console.error('Swimlane preference load failed:', e);
      return false;
    }
  }

  /**
   * Check if swimlane preference exists
   */
  hasSwimlanePreference(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEYS.SWIMLANE) !== null;
    } catch (e) {
      console.error('Swimlane preference check failed:', e);
      return false;
    }
  }
}
