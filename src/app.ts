/**
 * Main Application Logic
 * Coordinates all modules and handles user interactions
 */

import { Storage } from './storage';
import { Parser } from './parser';
import { TIMING, TEMPLATES } from './config';
import type { ThemeMode } from './types';

// Type definitions for DOM elements
interface DOMElements {
  markdownInput: HTMLTextAreaElement;
  visualizeBtn: HTMLButtonElement;
  timelineOutput: HTMLElement;
  outputPanel: HTMLElement;
  loadMarkdownBtn: HTMLButtonElement;
  loadMarkdownInput: HTMLInputElement;
  saveMarkdownBtn: HTMLButtonElement;
  saveHtmlBtn: HTMLButtonElement;
  savePngBtn: HTMLButtonElement;
  savePdfBtn: HTMLButtonElement;
  themeToggle: HTMLButtonElement;
  viewToggle: HTMLButtonElement;
  searchInput: HTMLInputElement;
  searchClear: HTMLButtonElement;
  filterButton: HTMLButtonElement;
  filterMenu: HTMLElement;
  filterCount: HTMLElement;
  statsToggle: HTMLButtonElement;
  statsModal: HTMLElement;
  statsModalClose: HTMLButtonElement;
  templatesToggle: HTMLButtonElement;
  templatesModal: HTMLElement;
  templatesModalClose: HTMLButtonElement;
  templateGrid: HTMLElement;
}

/**
 * Main Timeline Application Class
 * Entry point that coordinates all modules and manages the application lifecycle
 */
export class TimelineApp {
  // Module instances
  private storage: Storage;

  // DOM Elements
  private elements!: DOMElements;

  // Timeouts
  private debounceTimeoutId?: number;
  private autosaveTimeoutId?: number;
  private searchTimeoutId?: number;

  // Current view mode
  private useSwimlanes = false;

  // Current theme
  private currentTheme: ThemeMode = 'light';

  constructor() {
    this.storage = new Storage();
  }

  /**
   * Initialize application
   */
  async init(): Promise<void> {
    this.cacheDOMElements();
    await this.initImages();
    this.loadFromStorage();
    this.loadTheme();
    this.setupEventListeners();
    this.setupDragAndDrop();
    this.setupSearchAndFilter();
    this.setupModals();
    this.setupTemplates();
    await this.parseAndRenderTimeline();
  }

  /**
   * Initialize image management
   */
  private async initImages(): Promise<void> {
    try {
      // @ts-expect-error - Images module not yet converted to TypeScript
      await TimelineApp.Images.init();
      console.log('Image management initialized');
    } catch (e) {
      console.error('Failed to initialize images:', e);
    }
  }

  /**
   * Cache DOM element references
   */
  private cacheDOMElements(): void {
    this.elements = {
      markdownInput: document.getElementById('markdownInput') as HTMLTextAreaElement,
      visualizeBtn: document.getElementById('visualizeBtn') as HTMLButtonElement,
      timelineOutput: document.getElementById('timelineOutput') as HTMLElement,
      outputPanel: document.getElementById('outputPanel') as HTMLElement,
      loadMarkdownBtn: document.getElementById('loadMarkdownBtn') as HTMLButtonElement,
      loadMarkdownInput: document.getElementById('loadMarkdownInput') as HTMLInputElement,
      saveMarkdownBtn: document.getElementById('saveMarkdownBtn') as HTMLButtonElement,
      saveHtmlBtn: document.getElementById('saveHtmlBtn') as HTMLButtonElement,
      savePngBtn: document.getElementById('savePngBtn') as HTMLButtonElement,
      savePdfBtn: document.getElementById('savePdfBtn') as HTMLButtonElement,
      themeToggle: document.getElementById('themeToggle') as HTMLButtonElement,
      viewToggle: document.getElementById('viewToggle') as HTMLButtonElement,
      searchInput: document.getElementById('searchInput') as HTMLInputElement,
      searchClear: document.getElementById('searchClear') as HTMLButtonElement,
      filterButton: document.getElementById('filterButton') as HTMLButtonElement,
      filterMenu: document.getElementById('filterMenu') as HTMLElement,
      filterCount: document.getElementById('filterCount') as HTMLElement,
      statsToggle: document.getElementById('statsToggle') as HTMLButtonElement,
      statsModal: document.getElementById('statsModal') as HTMLElement,
      statsModalClose: document.getElementById('statsModalClose') as HTMLButtonElement,
      templatesToggle: document.getElementById('templatesToggle') as HTMLButtonElement,
      templatesModal: document.getElementById('templatesModal') as HTMLElement,
      templatesModalClose: document.getElementById('templatesModalClose') as HTMLButtonElement,
      templateGrid: document.getElementById('templateGrid') as HTMLElement,
    };
  }

  /**
   * Load data from LocalStorage
   */
  private loadFromStorage(): void {
    const saved = this.storage.loadFromLocalStorage();
    this.elements.markdownInput.value = saved;
    this.storage.loadHistory();

    // Check if a swimlane preference is already set
    const preferenceExists = this.storage.hasSwimlanePreference();
    if (preferenceExists) {
      this.useSwimlanes = this.storage.loadSwimlanePreference();
    } else {
      // If no preference, decide based on content
      const { body } = Parser.extractTitleFromMarkdown(saved);
      const events = Parser.parseEvents(body, 0);
      const uniqueGroups = [...new Set(events.map(event => event.group))];

      this.useSwimlanes = uniqueGroups.length > 1;
      this.storage.saveSwimlanePreference(this.useSwimlanes);
    }
  }

  /**
   * Load and apply theme
   */
  private loadTheme(): void {
    this.currentTheme = this.storage.loadTheme();
    this.applyTheme(this.currentTheme);
    this.applyViewPreference();
  }

  /**
   * Apply theme to document
   */
  private applyTheme(theme: ThemeMode): void {
    document.documentElement.setAttribute('data-theme', theme);
    this.elements.themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    this.currentTheme = theme;
    this.storage.saveTheme(theme);
  }

  /**
   * Apply view preference to button
   */
  private applyViewPreference(): void {
    if (this.elements.viewToggle) {
      this.elements.viewToggle.textContent = this.useSwimlanes ? '📜' : '🛤️';
      this.elements.viewToggle.title = this.useSwimlanes ? 'Listenansicht' : 'Swimlane-Ansicht';
      if (this.useSwimlanes) {
        this.elements.viewToggle.classList.add('active');
      } else {
        this.elements.viewToggle.classList.remove('active');
      }
    }
  }

  /**
   * Toggle theme
   */
  private toggleTheme(): void {
    const newTheme: ThemeMode = this.currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme(newTheme);

    // Update presentation window if open
    // @ts-expect-error - Presentation module not yet converted to TypeScript
    if (TimelineApp.Presentation.isOpen()) {
      // @ts-expect-error - Presentation module not yet converted to TypeScript
      TimelineApp.Presentation.sendThemeUpdate(newTheme);
    }
  }

  /**
   * Toggle view mode (linear vs. swimlanes)
   */
  private toggleView(): void {
    this.useSwimlanes = !this.useSwimlanes;
    this.storage.saveSwimlanePreference(this.useSwimlanes);
    this.applyViewPreference();
    this.parseAndRenderTimeline();

    // Update presentation window if open
    // @ts-expect-error - Presentation module not yet converted to TypeScript
    if (TimelineApp.Presentation.isOpen()) {
      // @ts-expect-error - Presentation module not yet converted to TypeScript
      TimelineApp.Presentation.sendViewUpdate(this.useSwimlanes);
    }
  }

  /**
   * Get current title from markdown
   */
  private getCurrentTitle(): string | null {
    const { title } = Parser.extractTitleFromMarkdown(
      this.elements.markdownInput.value || ''
    );
    return title && title.trim() ? title.trim() : null;
  }

  /**
   * Parse and render timeline
   */
  private async parseAndRenderTimeline(): Promise<boolean> {
    // @ts-expect-error - Renderer module not yet converted to TypeScript
    const success = await TimelineApp.Renderer.renderTimeline(
      this.elements.markdownInput,
      this.elements.timelineOutput,
      this.useSwimlanes
    );
    if (success) {
      // @ts-expect-error - Search module not yet converted to TypeScript
      TimelineApp.Search.applySearchAndFilter(
        this.elements.searchInput.value,
        this.elements.timelineOutput
      );
    }
    return success;
  }

  /**
   * Update visualize button text based on presentation window state
   */
  private updateVisualizeButton(): void {
    // @ts-expect-error - Presentation module not yet converted to TypeScript
    if (TimelineApp.Presentation.isOpen()) {
      this.elements.visualizeBtn.textContent = 'Präsentation schließen';
      this.elements.visualizeBtn.style.backgroundColor = '#dc3545';
    } else {
      this.elements.visualizeBtn.textContent = 'Präsentation öffnen';
      this.elements.visualizeBtn.style.backgroundColor = '';
    }
  }

  /**
   * Setup all event listeners
   */
  private setupEventListeners(): void {
    // Theme toggle
    this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());

    // View toggle
    if (this.elements.viewToggle) {
      this.elements.viewToggle.addEventListener('click', () => this.toggleView());
    }

    // Visualize button
    this.elements.visualizeBtn.addEventListener('click', () => this.handleVisualize());

    // Markdown input
    this.elements.markdownInput.addEventListener('input', () => this.handleMarkdownInput());

    // File operations
    this.elements.loadMarkdownBtn.addEventListener('click', async () => {
      // Try using File System Access API first
      if ('showOpenFilePicker' in window) {
        const useFileSystem = confirm(
          'Möchten Sie eine Markdown-Datei mit Bildern laden?\n\n' +
            'Ja = Ordner-basiertes Laden (mit Bildern)\n' +
            'Nein = Einzelne Datei auswählen'
        );

        if (useFileSystem) {
          // @ts-expect-error - Export module not yet converted to TypeScript
          const markdown = await TimelineApp.Export.loadMarkdownWithImages();
          if (markdown) {
            this.elements.markdownInput.value = markdown;
            this.storage.saveToHistory(markdown);
            this.storage.saveToLocalStorage(markdown);
            await this.parseAndRenderTimeline();

            // @ts-expect-error - Presentation module not yet converted to TypeScript
            if (TimelineApp.Presentation.isOpen()) {
              // @ts-expect-error - Presentation module not yet converted to TypeScript
              TimelineApp.Presentation.sendMarkdownUpdate(markdown);
            }
          }
          return;
        }
      }

      // Fallback to standard file input
      this.elements.loadMarkdownInput.value = '';
      this.elements.loadMarkdownInput.click();
    });

    this.elements.loadMarkdownInput.addEventListener('change', (e) => this.handleFileLoad(e));
    this.elements.saveMarkdownBtn.addEventListener('click', () => this.handleSaveMarkdown());
    this.elements.saveHtmlBtn.addEventListener('click', () => this.handleSaveHtml());
    this.elements.savePngBtn.addEventListener('click', () => this.handleSavePng());
    this.elements.savePdfBtn.addEventListener('click', () => this.handleSavePdf());

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));

    // Timeline click events
    this.elements.timelineOutput.addEventListener('click', (e) => this.handleTimelineClick(e));
  }

  /**
   * Handle visualize button click
   */
  private handleVisualize(): void {
    // @ts-expect-error - Presentation module not yet converted to TypeScript
    const isOpen = TimelineApp.Presentation.toggle();
    this.updateVisualizeButton();

    // Also parse and render in main window
    this.parseAndRenderTimeline();
  }

  /**
   * Handle markdown input changes
   */
  private handleMarkdownInput(): void {
    this.storage.saveToHistory(this.elements.markdownInput.value);

    if (this.debounceTimeoutId) {
      clearTimeout(this.debounceTimeoutId);
    }

    this.debounceTimeoutId = window.setTimeout(() => {
      if (!document.body.classList.contains('fullscreen-mode')) {
        this.parseAndRenderTimeline();
      }

      // Update presentation window if open
      // @ts-expect-error - Presentation module not yet converted to TypeScript
      if (TimelineApp.Presentation.isOpen()) {
        // @ts-expect-error - Presentation module not yet converted to TypeScript
        TimelineApp.Presentation.sendMarkdownUpdate(
          this.elements.markdownInput.value
        );
      }
    }, TIMING.DEBOUNCE_DELAY);

    if (this.autosaveTimeoutId) {
      clearTimeout(this.autosaveTimeoutId);
    }

    this.autosaveTimeoutId = window.setTimeout(() => {
      this.storage.saveToLocalStorage(this.elements.markdownInput.value);
    }, TIMING.AUTOSAVE_DELAY);
  }

  /**
   * Handle file load
   */
  private handleFileLoad(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      const text = typeof result === 'string' ? result : '';
      this.elements.markdownInput.value = text;
      this.storage.saveToHistory(text);
      this.storage.saveToLocalStorage(text);
      this.parseAndRenderTimeline();

      // Update presentation window if open
      // @ts-expect-error - Presentation module not yet converted to TypeScript
      if (TimelineApp.Presentation.isOpen()) {
        // @ts-expect-error - Presentation module not yet converted to TypeScript
        TimelineApp.Presentation.sendMarkdownUpdate(text);
      }

      if (!document.body.classList.contains('fullscreen-mode')) {
        this.elements.outputPanel.scrollTop = 0;
      }
    };
    reader.onerror = () => {
      alert('Fehler beim Laden der Markdown-Datei.');
    };
    reader.readAsText(file, 'utf-8');
  }

  /**
   * Handle save markdown
   */
  private async handleSaveMarkdown(): Promise<void> {
    if (!document.body.classList.contains('fullscreen-mode')) {
      await this.parseAndRenderTimeline();
    }

    const fullMarkdown = this.elements.markdownInput.value;
    const hasImages = /!\[([^\]]*)\]\(images\/([^)]+)\)/.test(fullMarkdown);

    if (hasImages) {
      const useFileSystem = confirm(
        'Diese Timeline enthält Bilder.\n\n' +
          'Möchten Sie mit Bildern speichern? (Chrome/Edge erforderlich)\n\n' +
          'Ja = Ordner mit Markdown + images/\n' +
          'Nein = Nur Markdown-Datei'
      );

      if (useFileSystem) {
        // @ts-expect-error - Export module not yet converted to TypeScript
        await TimelineApp.Export.exportMarkdownWithImages(
          fullMarkdown,
          this.elements.timelineOutput,
          () => this.getCurrentTitle()
        );
        return;
      }
    }

    // Standard markdown export
    // @ts-expect-error - Export module not yet converted to TypeScript
    TimelineApp.Export.exportMarkdown(
      fullMarkdown,
      this.elements.timelineOutput,
      () => this.getCurrentTitle()
    );
  }

  /**
   * Handle save HTML
   */
  private async handleSaveHtml(): Promise<void> {
    if (!document.body.classList.contains('fullscreen-mode')) {
      await this.parseAndRenderTimeline();
    }
    // @ts-expect-error - Export module not yet converted to TypeScript
    TimelineApp.Export.exportHtml(this.elements.timelineOutput, () => this.getCurrentTitle());
  }

  /**
   * Handle save PNG
   */
  private handleSavePng(): void {
    // @ts-expect-error - Export module not yet converted to TypeScript
    TimelineApp.Export.exportPng(
      this.elements.outputPanel,
      () => this.getCurrentTitle(),
      () => this.parseAndRenderTimeline()
    );
  }

  /**
   * Handle save PDF
   */
  private handleSavePdf(): void {
    // @ts-expect-error - Export module not yet converted to TypeScript
    TimelineApp.Export.exportPdf(
      this.elements.outputPanel,
      () => this.getCurrentTitle(),
      () => this.parseAndRenderTimeline()
    );
  }

  /**
   * Handle keyboard shortcuts
   */
  private handleKeyDown(event: KeyboardEvent): void {
    // ESC - Exit fullscreen or close modals
    if (event.key === 'Escape') {
      if (document.body.classList.contains('fullscreen-mode')) {
        document.body.classList.remove('fullscreen-mode');
      }
      if (this.elements.statsModal.classList.contains('show')) {
        this.elements.statsModal.classList.remove('show');
        this.elements.statsToggle.classList.remove('active');
      }
      if (this.elements.templatesModal.classList.contains('show')) {
        this.elements.templatesModal.classList.remove('show');
        this.elements.templatesToggle.classList.remove('active');
      }
    }

    // Ctrl+Enter - Visualize
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      this.elements.visualizeBtn.click();
    }

    // Ctrl+S - Save
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault();
      this.elements.saveMarkdownBtn.click();
    }

    // Ctrl+F - Focus search
    if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
      event.preventDefault();
      this.elements.searchInput.focus();
      this.elements.searchInput.select();
    }

    // Ctrl+Z - Undo
    if (
      (event.ctrlKey || event.metaKey) &&
      event.key === 'z' &&
      !event.shiftKey
    ) {
      event.preventDefault();
      this.storage.undo(this.elements.markdownInput, () => this.parseAndRenderTimeline());
    }

    // Ctrl+Y or Ctrl+Shift+Z - Redo
    if (
      (event.ctrlKey || event.metaKey) &&
      (event.key === 'y' || (event.shiftKey && event.key === 'z'))
    ) {
      event.preventDefault();
      this.storage.redo(this.elements.markdownInput, () => this.parseAndRenderTimeline());
    }
  }

  /**
   * Handle timeline click (for scrolling to source)
   */
  private handleTimelineClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const dateElement = target.closest('.timeline-date');
    if (!dateElement) return;

    const timelineItem = dateElement.closest('.timeline-item') as HTMLElement;
    if (
      timelineItem &&
      timelineItem.dataset.startPos &&
      timelineItem.dataset.endPos
    ) {
      const start = parseInt(timelineItem.dataset.startPos, 10);
      const end = parseInt(timelineItem.dataset.endPos, 10);
      // @ts-expect-error - Renderer module not yet converted to TypeScript
      TimelineApp.Renderer.scrollToSource(start, end, this.elements.markdownInput);
    }
  }

  /**
   * Setup drag and drop
   */
  private setupDragAndDrop(): void {
    this.elements.markdownInput.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.elements.markdownInput.classList.add('drag-over');
    });

    this.elements.markdownInput.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.elements.markdownInput.classList.remove('drag-over');
    });

    this.elements.markdownInput.addEventListener('drop', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.elements.markdownInput.classList.remove('drag-over');

      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;

      console.log('Files dropped:', files.length);

      // First, check if there are any images
      const hasImages = Array.from(files).some((file) =>
        file.type.startsWith('image/')
      );

      if (hasImages) {
        // Handle images using the Images module
        console.log('Processing images...');
        // @ts-expect-error - Images module not yet converted to TypeScript
        const imagesHandled = await TimelineApp.Images.handleDrop(
          e,
          this.elements.markdownInput
        );

        if (imagesHandled) {
          console.log('Images successfully handled');
          return;
        }
      }

      // No images or image handling failed - check for markdown files
      const file = files[0];
      console.log('Checking file:', file.name, file.type);

      if (
        file.name.endsWith('.md') ||
        file.type === 'text/markdown' ||
        file.type === 'text/plain'
      ) {
        console.log('Loading markdown file...');
        const reader = new FileReader();
        reader.onload = (evt) => {
          const result = evt.target?.result as string;
          this.elements.markdownInput.value = result;
          this.storage.saveToHistory(result);
          this.storage.saveToLocalStorage(result);
          this.parseAndRenderTimeline();

          // Update presentation window if open
          // @ts-expect-error - Presentation module not yet converted to TypeScript
          if (TimelineApp.Presentation.isOpen()) {
            // @ts-expect-error - Presentation module not yet converted to TypeScript
            TimelineApp.Presentation.sendMarkdownUpdate(result);
          }
        };
        reader.readAsText(file, 'utf-8');
      } else if (!hasImages) {
        alert('Bitte nur .md, Text-Dateien oder Bilder ablegen.');
      }
    });

    // Paste event for screenshots
    this.elements.markdownInput.addEventListener('paste', async (e) => {
      // @ts-expect-error - Images module not yet converted to TypeScript
      await TimelineApp.Images.handlePaste(e, this.elements.markdownInput);
    });
  }

  /**
   * Setup search and filter
   */
  private setupSearchAndFilter(): void {
    this.elements.searchInput.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      const query = target.value;
      this.elements.searchClear.classList.toggle('visible', query.length > 0);

      if (this.searchTimeoutId) {
        clearTimeout(this.searchTimeoutId);
      }

      this.searchTimeoutId = window.setTimeout(() => {
        // @ts-expect-error - Search module not yet converted to TypeScript
        TimelineApp.Search.applySearchAndFilter(query, this.elements.timelineOutput);

        // Update presentation window if open
        // @ts-expect-error - Presentation module not yet converted to TypeScript
        if (TimelineApp.Presentation.isOpen()) {
          // @ts-expect-error - Presentation module not yet converted to TypeScript
          TimelineApp.Presentation.sendFiltersUpdate();
        }
      }, TIMING.SEARCH_DELAY);
    });

    this.elements.searchClear.addEventListener('click', () => {
      this.elements.searchInput.value = '';
      this.elements.searchClear.classList.remove('visible');
      // @ts-expect-error - Search module not yet converted to TypeScript
      TimelineApp.Search.applySearchAndFilter('', this.elements.timelineOutput);

      // Update presentation window if open
      // @ts-expect-error - Presentation module not yet converted to TypeScript
      if (TimelineApp.Presentation.isOpen()) {
        // @ts-expect-error - Presentation module not yet converted to TypeScript
        TimelineApp.Presentation.sendFiltersUpdate();
      }
    });

    this.elements.filterButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.elements.filterMenu.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (
        !this.elements.filterMenu.contains(target) &&
        target !== this.elements.filterButton
      ) {
        this.elements.filterMenu.classList.remove('show');
      }
    });

    const filterCheckboxes = this.elements.filterMenu.querySelectorAll<HTMLInputElement>(
      'input[type="checkbox"]'
    );
    filterCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener('change', () => {
        // @ts-expect-error - Search module not yet converted to TypeScript
        TimelineApp.Search.toggleFilter(checkbox.value, checkbox.checked);
        // @ts-expect-error - Search module not yet converted to TypeScript
        TimelineApp.Search.updateFilterButton(
          this.elements.filterButton,
          this.elements.filterCount
        );
        // @ts-expect-error - Search module not yet converted to TypeScript
        TimelineApp.Search.applySearchAndFilter(
          this.elements.searchInput.value,
          this.elements.timelineOutput
        );

        // Update presentation window if open
        // @ts-expect-error - Presentation module not yet converted to TypeScript
        if (TimelineApp.Presentation.isOpen()) {
          // @ts-expect-error - Presentation module not yet converted to TypeScript
          TimelineApp.Presentation.sendFiltersUpdate();
        }
      });
    });

    // @ts-expect-error - Search module not yet converted to TypeScript
    TimelineApp.Search.updateFilterButton(
      this.elements.filterButton,
      this.elements.filterCount
    );
  }

  /**
   * Setup modals
   */
  private setupModals(): void {
    // Statistics Modal
    this.elements.statsToggle.addEventListener('click', () => {
      // @ts-expect-error - Renderer module not yet converted to TypeScript
      const events = TimelineApp.Renderer.getAllEvents();
      // @ts-expect-error - Stats module not yet converted to TypeScript
      TimelineApp.Stats.calculate(events);
      // @ts-expect-error - Stats module not yet converted to TypeScript
      TimelineApp.Stats.render();
      this.elements.statsModal.classList.add('show');
      this.elements.statsToggle.classList.add('active');
    });

    this.elements.statsModalClose.addEventListener('click', () => {
      this.elements.statsModal.classList.remove('show');
      this.elements.statsToggle.classList.remove('active');
    });

    // Templates Modal
    this.elements.templatesToggle.addEventListener('click', () => {
      this.elements.templatesModal.classList.add('show');
      this.elements.templatesToggle.classList.add('active');
    });

    this.elements.templatesModalClose.addEventListener('click', () => {
      this.elements.templatesModal.classList.remove('show');
      this.elements.templatesToggle.classList.remove('active');
    });

    // Close on outside click
    this.elements.statsModal.addEventListener('click', (e) => {
      if (e.target === this.elements.statsModal) {
        this.elements.statsModal.classList.remove('show');
        this.elements.statsToggle.classList.remove('active');
      }
    });

    this.elements.templatesModal.addEventListener('click', (e) => {
      if (e.target === this.elements.templatesModal) {
        this.elements.templatesModal.classList.remove('show');
        this.elements.templatesToggle.classList.remove('active');
      }
    });
  }

  /**
   * Setup templates
   */
  private setupTemplates(): void {
    this.elements.templateGrid.innerHTML = '';

    Object.keys(TEMPLATES).forEach((key) => {
      const template = TEMPLATES[key];
      const card = document.createElement('div');
      card.className = 'template-card';
      card.innerHTML = `
        <div class="template-title">${template.name}</div>
        <div class="template-description">${template.description}</div>
      `;
      card.addEventListener('click', () => this.loadTemplate(key));
      this.elements.templateGrid.appendChild(card);
    });
  }

  /**
   * Load template
   */
  private loadTemplate(key: string): void {
    const template = TEMPLATES[key];
    if (template) {
      if (
        this.elements.markdownInput.value.trim() &&
        !confirm('Aktuellen Inhalt überschreiben?')
      ) {
        return;
      }
      this.elements.markdownInput.value = template.content;
      this.storage.saveToHistory(template.content);
      this.storage.saveToLocalStorage(template.content);
      this.parseAndRenderTimeline();

      // Update presentation window if open
      // @ts-expect-error - Presentation module not yet converted to TypeScript
      if (TimelineApp.Presentation.isOpen()) {
        // @ts-expect-error - Presentation module not yet converted to TypeScript
        TimelineApp.Presentation.sendMarkdownUpdate(template.content);
      }

      this.elements.templatesModal.classList.remove('show');
      this.elements.templatesToggle.classList.remove('active');
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const app = new TimelineApp();
    app.init();
  });
} else {
  const app = new TimelineApp();
  app.init();
}
