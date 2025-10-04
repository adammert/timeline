/**
 * LocalStorage Management Module
 */

TimelineApp.Storage = {
  // State
  undoHistory: [],
  redoHistory: [],
  isUndoRedoAction: false,

  /**
   * Save content to LocalStorage
   */
  saveToLocalStorage(content) {
    try {
      localStorage.setItem(TimelineApp.Config.AUTOSAVE_KEY, content);
      localStorage.setItem(
        TimelineApp.Config.AUTOSAVE_TIMESTAMP_KEY,
        new Date().toISOString()
      );
      this.showAutosaveIndicator();
    } catch (e) {
      console.error("LocalStorage save failed:", e);
    }
  },

  /**
   * Load content from LocalStorage
   */
  loadFromLocalStorage() {
    try {
      const saved = localStorage.getItem(TimelineApp.Config.AUTOSAVE_KEY);
      const timestamp = localStorage.getItem(TimelineApp.Config.AUTOSAVE_TIMESTAMP_KEY);

      if (saved) {
        if (timestamp) {
          const date = new Date(timestamp);
          console.log("Loaded from autosave:", date.toLocaleString());
        }
        return saved;
      } else {
        // Return default template if nothing saved
        return TimelineApp.Config.TEMPLATES.project.content;
      }
    } catch (e) {
      console.error("LocalStorage load failed:", e);
      return TimelineApp.Config.TEMPLATES.project.content;
    }
  },

  /**
   * Show autosave indicator
   */
  showAutosaveIndicator() {
    const indicator = document.getElementById("autosaveIndicator");
    if (indicator) {
      indicator.classList.add("show");
      setTimeout(() => {
        indicator.classList.remove("show");
      }, TimelineApp.Config.AUTOSAVE_INDICATOR_DURATION);
    }
  },

  /**
   * Save current state to history
   */
  saveToHistory(currentValue) {
    if (this.isUndoRedoAction) return;

    if (
      this.undoHistory.length > 0 &&
      this.undoHistory[this.undoHistory.length - 1] === currentValue
    ) {
      return;
    }

    this.undoHistory.push(currentValue);
    this.redoHistory = [];

    if (this.undoHistory.length > TimelineApp.Config.MAX_HISTORY_SIZE) {
      this.undoHistory.shift();
    }

    try {
      localStorage.setItem(
        TimelineApp.Config.HISTORY_KEY,
        JSON.stringify(this.undoHistory.slice(-TimelineApp.Config.HISTORY_SAVE_SIZE))
      );
    } catch (e) {
      console.error("History save failed:", e);
    }
  },

  /**
   * Load history from LocalStorage
   */
  loadHistory() {
    try {
      const saved = localStorage.getItem(TimelineApp.Config.HISTORY_KEY);
      if (saved) {
        this.undoHistory = JSON.parse(saved);
      }
    } catch (e) {
      console.error("History load failed:", e);
    }
  },

  /**
   * Undo last change
   */
  undo(markdownInput, parseCallback) {
    if (this.undoHistory.length < 2) return;

    this.isUndoRedoAction = true;

    const current = this.undoHistory.pop();
    this.redoHistory.push(current);

    const previous = this.undoHistory[this.undoHistory.length - 1];
    markdownInput.value = previous;

    if (parseCallback) parseCallback();

    setTimeout(() => {
      this.isUndoRedoAction = false;
    }, 100);
  },

  /**
   * Redo last undone change
   */
  redo(markdownInput, parseCallback) {
    if (this.redoHistory.length === 0) return;

    this.isUndoRedoAction = true;

    const next = this.redoHistory.pop();
    this.undoHistory.push(next);
    markdownInput.value = next;

    if (parseCallback) parseCallback();

    setTimeout(() => {
      this.isUndoRedoAction = false;
    }, 100);
  },

  /**
   * Save theme preference
   */
  saveTheme(theme) {
    try {
      localStorage.setItem(TimelineApp.Config.THEME_KEY, theme);
    } catch (e) {
      console.error("Theme save failed:", e);
    }
  },

  /**
   * Load theme preference
   */
  loadTheme() {
    try {
      return localStorage.getItem(TimelineApp.Config.THEME_KEY) || "light";
    } catch (e) {
      console.error("Theme load failed:", e);
      return "light";
    }
  }
};
