/**
 * Main Application Logic
 * Coordinates all modules and handles user interactions
 */

import { Storage } from './storage';
import { Parser } from './parser';
import { TIMING, TEMPLATES } from './config';
import { Images } from './images';
import { Presentation } from './presentation';
import { Search } from './search';
import { Renderer } from './renderer';
import { Export } from './export';
import { Stats } from './stats';
import { SyntaxHighlighter } from './syntax-highlight';
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
  saveMarkdownBtnAlt: HTMLButtonElement;
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
  lineNumbers: HTMLElement;
}

/**
 * Main Timeline Application Class
 * Entry point that coordinates all modules and manages the application lifecycle
 */
export class TimelineApp {
  // Module instances
  private storage: Storage;
  private images: Images;
  private presentation: Presentation;
  private search: Search;
  private renderer: Renderer;
  private export: Export;
  private stats: Stats;
  private syntaxHighlighter: SyntaxHighlighter | null = null;

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
    this.images = new Images();
    this.presentation = new Presentation();
    this.search = new Search();
    this.renderer = new Renderer(this.images);
    this.stats = new Stats();
    this.export = new Export(this.renderer, this.images);
  }

  /**
   * Initialize application
   */
  async init(): Promise<void> {
    try {
      this.cacheDOMElements();
      await this.initImages();
      this.loadFromStorage();
      this.loadTheme();
      this.setupEventListeners();
      this.setupLineNumbers();
      this.setupSyntaxHighlighting();
      this.setupDragAndDrop();
      this.setupSearchAndFilter();
      this.setupModals();
      this.setupTemplates();
      await this.parseAndRenderTimeline();
    } catch (error) {
      console.error('Failed to initialize application:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      alert(`Fehler beim Initialisieren der Anwendung:\n${errorMessage}\n\nBitte laden Sie die Seite neu.`);
    }
  }

  /**
   * Initialize image management
   */
  private async initImages(): Promise<void> {
    try {
      await this.images.init();
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
      saveMarkdownBtnAlt: document.getElementById('saveMarkdownBtnAlt') as HTMLButtonElement,
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
      lineNumbers: document.getElementById('lineNumbers') as HTMLElement,
    };
  }

  /**
   * Load data from LocalStorage
   */
  private loadFromStorage(): void {
    const saved = this.storage.loadFromLocalStorage();
    this.elements.markdownInput.value = saved;
    this.refreshSyntaxHighlighting();
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
    this.setupSystemThemeListener();
  }

  /**
   * Listen for system theme preference changes
   */
  private setupSystemThemeListener(): void {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      // Only react to system changes if user hasn't explicitly set a preference
      mediaQuery.addEventListener('change', (e) => {
        if (!this.storage.hasThemePreference()) {
          const newTheme = e.matches ? 'dark' : 'light';
          this.applyTheme(newTheme);

          // Update presentation window if open
          if (this.presentation.isOpen()) {
            this.presentation.sendUpdate(undefined, newTheme);
          }
        }
      });
    }
  }

  /**
   * Apply theme to document
   */
  private applyTheme(theme: ThemeMode): void {
    // Toggle dark class on html element for Tailwind
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    document.documentElement.setAttribute('data-theme', theme);

    // Update theme toggle icon (Material Icon)
    const iconElement = this.elements.themeToggle.querySelector('.material-icons-round');
    if (iconElement) {
      iconElement.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
    }

    this.currentTheme = theme;
    this.storage.saveTheme(theme);
  }

  /**
   * Apply view preference to button
   */
  private applyViewPreference(): void {
    if (this.elements.viewToggle) {
      // Update Material Icon
      const iconElement = this.elements.viewToggle.querySelector('.material-icons-round');
      if (iconElement) {
        iconElement.textContent = this.useSwimlanes ? 'view_list' : 'view_column';
      }
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
    if (this.presentation.isOpen()) {
      this.presentation.sendUpdate(undefined, newTheme);
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
    if (this.presentation.isOpen()) {
      this.presentation.sendUpdate();
    }
  }

  /**
   * Get current title from markdown
   */
  private getCurrentTitle(): string {
    const { title } = Parser.extractTitleFromMarkdown(
      this.elements.markdownInput.value || ''
    );
    return title && title.trim() ? title.trim() : '';
  }

  /**
   * Parse and render timeline
   */
  private async parseAndRenderTimeline(): Promise<boolean> {
    const success = await this.renderer.renderTimeline(
      this.elements.markdownInput,
      this.elements.timelineOutput,
      this.useSwimlanes
    );
    if (success) {
      this.search.applySearchAndFilter(
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
    const iconElement = this.elements.visualizeBtn.querySelector('.material-icons-round');
    if (this.presentation.isOpen()) {
      // Update button to "close" state
      if (iconElement) {
        iconElement.textContent = 'close';
      }
      // Update text node (after icon)
      const textNode = Array.from(this.elements.visualizeBtn.childNodes)
        .find(node => node.nodeType === Node.TEXT_NODE);
      if (textNode) {
        textNode.textContent = ' Präsentation schließen';
      }
      // Switch to danger style
      this.elements.visualizeBtn.classList.remove('bg-primary', 'hover:bg-blue-600', 'shadow-glow');
      this.elements.visualizeBtn.classList.add('bg-danger', 'hover:bg-red-600');
    } else {
      // Update button to "open" state
      if (iconElement) {
        iconElement.textContent = 'play_arrow';
      }
      const textNode = Array.from(this.elements.visualizeBtn.childNodes)
        .find(node => node.nodeType === Node.TEXT_NODE);
      if (textNode) {
        textNode.textContent = ' Präsentation öffnen';
      }
      // Switch to primary style
      this.elements.visualizeBtn.classList.remove('bg-danger', 'hover:bg-red-600');
      this.elements.visualizeBtn.classList.add('bg-primary', 'hover:bg-blue-600', 'shadow-glow');
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
          const markdown = await this.export.loadMarkdownWithImages();
          if (markdown) {
            this.elements.markdownInput.value = markdown;
            this.refreshSyntaxHighlighting();
            this.storage.saveToHistory(markdown);
            this.storage.saveToLocalStorage(markdown);
            await this.parseAndRenderTimeline();

            if (this.presentation.isOpen()) {
              this.presentation.sendUpdate(markdown);
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
    // Alternative save button in the action area
    if (this.elements.saveMarkdownBtnAlt) {
      this.elements.saveMarkdownBtnAlt.addEventListener('click', () => this.handleSaveMarkdown());
    }
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
    this.presentation.toggle();
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
      if (this.presentation.isOpen()) {
        this.presentation.sendUpdate(
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
      this.refreshSyntaxHighlighting();
      this.storage.saveToHistory(text);
      this.storage.saveToLocalStorage(text);
      this.parseAndRenderTimeline();

      // Update presentation window if open
      if (this.presentation.isOpen()) {
        this.presentation.sendUpdate(text);
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
        await this.export.exportMarkdownWithImages(
          fullMarkdown,
          this.elements.timelineOutput,
          () => this.getCurrentTitle()
        );
        return;
      }
    }

    // Standard markdown export
    this.export.exportMarkdown(
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
    this.export.exportHtml(this.elements.timelineOutput, () => this.getCurrentTitle());
  }

  /**
   * Handle save PNG
   */
  private handleSavePng(): void {
    this.export.exportPng(
      this.elements.outputPanel,
      () => this.getCurrentTitle(),
      async () => {
        await this.parseAndRenderTimeline();
      }
    );
  }

  /**
   * Handle save PDF
   */
  private handleSavePdf(): void {
    this.export.exportPdf(
      this.elements.outputPanel,
      () => this.getCurrentTitle(),
      async () => {
        await this.parseAndRenderTimeline();
      }
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
      if (!this.elements.statsModal.classList.contains('hidden')) {
        this.elements.statsModal.classList.add('hidden');
        this.elements.statsToggle.classList.remove('active');
      }
      if (!this.elements.templatesModal.classList.contains('hidden')) {
        this.elements.templatesModal.classList.add('hidden');
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
      this.renderer.scrollToSource(start, end, this.elements.markdownInput);
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

      try {
        // Separate files into images and other files
        const imageFiles = Array.from(files).filter((file) =>
          file.type.startsWith('image/')
        );
        const otherFiles = Array.from(files).filter((file) =>
          !file.type.startsWith('image/')
        );

        // Handle images first if present
        if (imageFiles.length > 0) {
          console.log('Processing images...');
          try {
            const imagesHandled = await this.images.handleDrop(
              e,
              this.elements.markdownInput
            );

            if (imagesHandled) {
              console.log('Images successfully handled');
              // If there are also other files, don't return yet
              if (otherFiles.length === 0) {
                return;
              }
            }
          } catch (error) {
            console.error('Error handling images:', error);
            alert('Fehler beim Verarbeiten der Bilder. Siehe Konsole für Details.');
            // Continue to try handling other files
          }
        }

        // Handle markdown/text files
        if (otherFiles.length > 0) {
          const file = otherFiles[0];
          if (file) {
            console.log('Checking file:', file.name, file.type);

            if (
              file.name.endsWith('.md') ||
              file.type === 'text/markdown' ||
              file.type === 'text/plain'
            ) {
              console.log('Loading markdown file...');
              const reader = new FileReader();
              reader.onload = (evt) => {
                const result = evt.target?.result;
                if (typeof result === 'string') {
                  this.elements.markdownInput.value = result;
                  this.refreshSyntaxHighlighting();
                  this.storage.saveToHistory(result);
                  this.storage.saveToLocalStorage(result);
                  this.parseAndRenderTimeline();

                  // Update presentation window if open
                  if (this.presentation.isOpen()) {
                    this.presentation.sendUpdate(result);
                  }
                }
              };
              reader.onerror = () => {
                alert('Fehler beim Laden der Markdown-Datei.');
              };
              reader.readAsText(file, 'utf-8');
            } else if (imageFiles.length === 0) {
              // Only show error if there were no images to handle
              alert('Bitte nur .md, Text-Dateien oder Bilder ablegen.');
            }
          }
        }
      } catch (error) {
        console.error('Error in drop handler:', error);
        alert('Fehler beim Verarbeiten der abgelegten Dateien.');
      }
    });

    // Paste event for screenshots
    this.elements.markdownInput.addEventListener('paste', async (e) => {
      await this.images.handlePaste(e, this.elements.markdownInput);
    });
  }

  /**
   * Setup search and filter
   */
  private setupSearchAndFilter(): void {
    this.elements.searchInput.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      const query = target.value;
      this.elements.searchClear.classList.toggle('hidden', query.length === 0);

      if (this.searchTimeoutId) {
        clearTimeout(this.searchTimeoutId);
      }

      this.searchTimeoutId = window.setTimeout(() => {
        this.search.applySearchAndFilter(query, this.elements.timelineOutput);

        // Update presentation window if open
        if (this.presentation.isOpen()) {
          this.presentation.sendUpdate();
        }
      }, TIMING.SEARCH_DELAY);
    });

    this.elements.searchClear.addEventListener('click', () => {
      this.elements.searchInput.value = '';
      this.elements.searchClear.classList.add('hidden');
      this.search.applySearchAndFilter('', this.elements.timelineOutput);

      // Update presentation window if open
      if (this.presentation.isOpen()) {
        this.presentation.sendUpdate();
      }
    });

    this.elements.filterButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.elements.filterMenu.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (
        !this.elements.filterMenu.contains(target) &&
        target !== this.elements.filterButton
      ) {
        this.elements.filterMenu.classList.add('hidden');
      }
    });

    const filterCheckboxes = this.elements.filterMenu.querySelectorAll<HTMLInputElement>(
      'input[type="checkbox"]'
    );
    filterCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener('change', () => {
        this.search.toggleFilter(checkbox.value, checkbox.checked);
        this.search.updateFilterButton(
          this.elements.filterButton,
          this.elements.filterCount
        );
        this.search.applySearchAndFilter(
          this.elements.searchInput.value,
          this.elements.timelineOutput
        );

        // Update presentation window if open
        if (this.presentation.isOpen()) {
          this.presentation.sendUpdate();
        }
      });
    });

    this.search.updateFilterButton(
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
      const events = this.renderer.getAllEvents();
      this.stats.calculate(events);
      this.stats.render();
      this.elements.statsModal.classList.remove('hidden');
      this.elements.statsToggle.classList.add('active');
    });

    this.elements.statsModalClose.addEventListener('click', () => {
      this.elements.statsModal.classList.add('hidden');
      this.elements.statsToggle.classList.remove('active');
    });

    // Templates Modal
    this.elements.templatesToggle.addEventListener('click', () => {
      this.elements.templatesModal.classList.remove('hidden');
      this.elements.templatesToggle.classList.add('active');
    });

    this.elements.templatesModalClose.addEventListener('click', () => {
      this.elements.templatesModal.classList.add('hidden');
      this.elements.templatesToggle.classList.remove('active');
    });

    // Close on outside click
    this.elements.statsModal.addEventListener('click', (e) => {
      if (e.target === this.elements.statsModal) {
        this.elements.statsModal.classList.add('hidden');
        this.elements.statsToggle.classList.remove('active');
      }
    });

    this.elements.templatesModal.addEventListener('click', (e) => {
      if (e.target === this.elements.templatesModal) {
        this.elements.templatesModal.classList.add('hidden');
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
      if (!template) return;

      const card = document.createElement('div');
      card.className = 'bg-gray-50 dark:bg-zinc-800 rounded-lg p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors border border-gray-200 dark:border-zinc-700';
      card.innerHTML = `
        <div class="font-semibold text-gray-800 dark:text-gray-200 mb-1">${template.name}</div>
        <div class="text-sm text-gray-500 dark:text-gray-400">${template.description}</div>
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
      this.refreshSyntaxHighlighting();
      this.storage.saveToHistory(template.content);
      this.storage.saveToLocalStorage(template.content);
      this.parseAndRenderTimeline();

      // Update presentation window if open
      if (this.presentation.isOpen()) {
        this.presentation.sendUpdate(template.content);
      }

      this.elements.templatesModal.classList.add('hidden');
      this.elements.templatesToggle.classList.remove('active');
    }
  }

  /**
   * Setup line numbers for the editor
   */
  private setupLineNumbers(): void {
    const updateLineNumbers = () => {
      if (!this.elements.lineNumbers || !this.elements.markdownInput) return;

      const text = this.elements.markdownInput.value;
      const lines = text.split('\n').length;
      const lineNumbersHtml: string[] = [];

      for (let i = 1; i <= lines; i++) {
        lineNumbersHtml.push(`<div class="leading-6">${i}</div>`);
      }

      this.elements.lineNumbers.innerHTML = lineNumbersHtml.join('');
    };

    // Update on input
    this.elements.markdownInput.addEventListener('input', updateLineNumbers);

    // Sync scroll position
    this.elements.markdownInput.addEventListener('scroll', () => {
      if (this.elements.lineNumbers) {
        this.elements.lineNumbers.scrollTop = this.elements.markdownInput.scrollTop;
      }
    });

    // Initial update
    updateLineNumbers();
  }

  /**
   * Setup syntax highlighting for the editor
   */
  private setupSyntaxHighlighting(): void {
    this.syntaxHighlighter = new SyntaxHighlighter(
      'markdownInput',
      'highlightOverlay',
      'highlightContent'
    );
  }

  /**
   * Refresh syntax highlighting (call after programmatic changes)
   */
  private refreshSyntaxHighlighting(): void {
    if (this.syntaxHighlighter) {
      this.syntaxHighlighter.refresh();
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
