/**
 * Main Application Logic
 * Coordinates all modules and handles user interactions
 */

(function() {
  "use strict";

  // DOM Elements
  let elements = {};
  
  // Timeouts
  let debounceTimeoutId;
  let autosaveTimeoutId;
  let searchTimeoutId;

  // Current theme
  let currentTheme = "light";

  /**
   * Initialize application
   */
  function init() {
    cacheDOMElements();
    loadFromStorage();
    loadTheme();
    setupEventListeners();
    setupDragAndDrop();
    setupSearchAndFilter();
    setupModals();
    setupTemplates();
    parseAndRenderTimeline();
  }

  /**
   * Cache DOM element references
   */
  function cacheDOMElements() {
    elements = {
      markdownInput: document.getElementById("markdownInput"),
      visualizeBtn: document.getElementById("visualizeBtn"),
      timelineOutput: document.getElementById("timelineOutput"),
      outputPanel: document.getElementById("outputPanel"),
      loadMarkdownBtn: document.getElementById("loadMarkdownBtn"),
      loadMarkdownInput: document.getElementById("loadMarkdownInput"),
      saveMarkdownBtn: document.getElementById("saveMarkdownBtn"),
      saveHtmlBtn: document.getElementById("saveHtmlBtn"),
      savePngBtn: document.getElementById("savePngBtn"),
      savePdfBtn: document.getElementById("savePdfBtn"),
      themeToggle: document.getElementById("themeToggle"),
      searchInput: document.getElementById("searchInput"),
      searchClear: document.getElementById("searchClear"),
      filterButton: document.getElementById("filterButton"),
      filterMenu: document.getElementById("filterMenu"),
      filterCount: document.getElementById("filterCount"),
      statsToggle: document.getElementById("statsToggle"),
      statsModal: document.getElementById("statsModal"),
      statsModalClose: document.getElementById("statsModalClose"),
      templatesToggle: document.getElementById("templatesToggle"),
      templatesModal: document.getElementById("templatesModal"),
      templatesModalClose: document.getElementById("templatesModalClose"),
      templateGrid: document.getElementById("templateGrid")
    };
  }

  /**
   * Load data from LocalStorage
   */
  function loadFromStorage() {
    const saved = TimelineApp.Storage.loadFromLocalStorage();
    elements.markdownInput.value = saved;
    TimelineApp.Storage.loadHistory();
  }

  /**
   * Load and apply theme
   */
  function loadTheme() {
    currentTheme = TimelineApp.Storage.loadTheme();
    applyTheme(currentTheme);
  }

  /**
   * Apply theme to document
   */
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    elements.themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
    currentTheme = theme;
    TimelineApp.Storage.saveTheme(theme);
  }

  /**
   * Toggle theme
   */
  function toggleTheme() {
    const newTheme = currentTheme === "light" ? "dark" : "light";
    applyTheme(newTheme);
    
    // Update presentation window if open
    if (TimelineApp.Presentation.isOpen()) {
      TimelineApp.Presentation.sendThemeUpdate(newTheme);
    }
  }

  /**
   * Get current title from markdown
   */
  function getCurrentTitle() {
    const { title } = TimelineApp.Parser.extractTitleFromMarkdown(
      elements.markdownInput.value || ""
    );
    return title && title.trim() ? title.trim() : null;
  }

  /**
   * Parse and render timeline
   */
  function parseAndRenderTimeline() {
    const success = TimelineApp.Renderer.renderTimeline(
      elements.markdownInput,
      elements.timelineOutput
    );
    if (success) {
      TimelineApp.Search.applySearchAndFilter(
        elements.searchInput.value,
        elements.timelineOutput
      );
    }
    return success;
  }

  /**
   * Update visualize button text based on presentation window state
   */
  function updateVisualizeButton() {
    if (TimelineApp.Presentation.isOpen()) {
      elements.visualizeBtn.textContent = 'Präsentation schließen';
      elements.visualizeBtn.style.backgroundColor = '#dc3545';
    } else {
      elements.visualizeBtn.textContent = 'Präsentation öffnen';
      elements.visualizeBtn.style.backgroundColor = '';
    }
  }

  /**
   * Setup all event listeners
   */
  function setupEventListeners() {
    // Theme toggle
    elements.themeToggle.addEventListener("click", toggleTheme);

    // Visualize button
    elements.visualizeBtn.addEventListener("click", handleVisualize);

    // Markdown input
    elements.markdownInput.addEventListener("input", handleMarkdownInput);

    // File operations
    elements.loadMarkdownBtn.addEventListener("click", () => {
      elements.loadMarkdownInput.value = "";
      elements.loadMarkdownInput.click();
    });

    elements.loadMarkdownInput.addEventListener("change", handleFileLoad);
    elements.saveMarkdownBtn.addEventListener("click", handleSaveMarkdown);
    elements.saveHtmlBtn.addEventListener("click", handleSaveHtml);
    elements.savePngBtn.addEventListener("click", handleSavePng);
    elements.savePdfBtn.addEventListener("click", handleSavePdf);

    // Keyboard shortcuts
    document.addEventListener("keydown", handleKeyDown);

    // Timeline click events
    elements.timelineOutput.addEventListener("click", handleTimelineClick);
  }

  /**
   * Handle visualize button click
   */
  function handleVisualize() {
    const isOpen = TimelineApp.Presentation.toggle();
    updateVisualizeButton();
    
    // Also parse and render in main window
    parseAndRenderTimeline();
  }

  /**
   * Handle markdown input changes
   */
  function handleMarkdownInput() {
    TimelineApp.Storage.saveToHistory(elements.markdownInput.value);

    clearTimeout(debounceTimeoutId);
    debounceTimeoutId = setTimeout(() => {
      if (!document.body.classList.contains("fullscreen-mode")) {
        parseAndRenderTimeline();
      }
      
      // Update presentation window if open (markdown only, theme unchanged)
      if (TimelineApp.Presentation.isOpen()) {
        TimelineApp.Presentation.sendMarkdownUpdate(elements.markdownInput.value);
      }
    }, TimelineApp.Config.DEBOUNCE_DELAY);

    clearTimeout(autosaveTimeoutId);
    autosaveTimeoutId = setTimeout(() => {
      TimelineApp.Storage.saveToLocalStorage(elements.markdownInput.value);
    }, TimelineApp.Config.AUTOSAVE_DELAY);
  }

  /**
   * Handle file load
   */
  function handleFileLoad(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = typeof e.target.result === "string" ? e.target.result : "";
      elements.markdownInput.value = text;
      TimelineApp.Storage.saveToHistory(text);
      TimelineApp.Storage.saveToLocalStorage(text);
      parseAndRenderTimeline();
      
      // Update presentation window if open
      if (TimelineApp.Presentation.isOpen()) {
        TimelineApp.Presentation.sendMarkdownUpdate(text);
      }
      
      if (!document.body.classList.contains("fullscreen-mode")) {
        elements.outputPanel.scrollTop = 0;
      }
    };
    reader.onerror = () => {
      alert("Fehler beim Laden der Markdown-Datei.");
    };
    reader.readAsText(file, "utf-8");
  }

  /**
   * Handle save markdown
   */
  function handleSaveMarkdown() {
    TimelineApp.Export.exportMarkdown(
      elements.markdownInput.value,
      getCurrentTitle
    );
  }

  /**
   * Handle save HTML
   */
  function handleSaveHtml() {
    if (!document.body.classList.contains("fullscreen-mode")) {
      parseAndRenderTimeline();
    }
    TimelineApp.Export.exportHtml(elements.timelineOutput, getCurrentTitle);
  }

  /**
   * Handle save PNG
   */
  function handleSavePng() {
    TimelineApp.Export.exportPng(
      elements.outputPanel,
      getCurrentTitle,
      parseAndRenderTimeline
    );
  }

  /**
   * Handle save PDF
   */
  function handleSavePdf() {
    TimelineApp.Export.exportPdf(
      elements.outputPanel,
      getCurrentTitle,
      parseAndRenderTimeline
    );
  }

  /**
   * Handle keyboard shortcuts
   */
  function handleKeyDown(event) {
    // ESC - Exit fullscreen or close modals
    if (event.key === "Escape") {
      if (document.body.classList.contains("fullscreen-mode")) {
        document.body.classList.remove("fullscreen-mode");
      }
      if (elements.statsModal.classList.contains("show")) {
        elements.statsModal.classList.remove("show");
        elements.statsToggle.classList.remove("active");
      }
      if (elements.templatesModal.classList.contains("show")) {
        elements.templatesModal.classList.remove("show");
        elements.templatesToggle.classList.remove("active");
      }
    }

    // Ctrl+Enter - Visualize
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      elements.visualizeBtn.click();
    }

    // Ctrl+S - Save
    if ((event.ctrlKey || event.metaKey) && event.key === "s") {
      event.preventDefault();
      elements.saveMarkdownBtn.click();
    }

    // Ctrl+F - Focus search
    if ((event.ctrlKey || event.metaKey) && event.key === "f") {
      event.preventDefault();
      elements.searchInput.focus();
      elements.searchInput.select();
    }

    // Ctrl+Z - Undo
    if ((event.ctrlKey || event.metaKey) && event.key === "z" && !event.shiftKey) {
      event.preventDefault();
      TimelineApp.Storage.undo(elements.markdownInput, parseAndRenderTimeline);
    }

    // Ctrl+Y or Ctrl+Shift+Z - Redo
    if (
      (event.ctrlKey || event.metaKey) &&
      (event.key === "y" || (event.shiftKey && event.key === "z"))
    ) {
      event.preventDefault();
      TimelineApp.Storage.redo(elements.markdownInput, parseAndRenderTimeline);
    }
  }

  /**
   * Handle timeline click (for scrolling to source)
   */
  function handleTimelineClick(event) {
    const dateElement = event.target.closest(".timeline-date");
    if (!dateElement) return;

    const timelineItem = dateElement.closest(".timeline-item");
    if (
      timelineItem &&
      timelineItem.dataset.startPos &&
      timelineItem.dataset.endPos
    ) {
      const start = parseInt(timelineItem.dataset.startPos, 10);
      const end = parseInt(timelineItem.dataset.endPos, 10);
      TimelineApp.Renderer.scrollToSource(start, end, elements.markdownInput);
    }
  }

  /**
   * Setup drag and drop
   */
  function setupDragAndDrop() {
    elements.markdownInput.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.stopPropagation();
      elements.markdownInput.classList.add("drag-over");
    });

    elements.markdownInput.addEventListener("dragleave", (e) => {
      e.preventDefault();
      e.stopPropagation();
      elements.markdownInput.classList.remove("drag-over");
    });

    elements.markdownInput.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
      elements.markdownInput.classList.remove("drag-over");

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        if (
          file.name.endsWith(".md") ||
          file.type === "text/markdown" ||
          file.type === "text/plain"
        ) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            elements.markdownInput.value = evt.target.result;
            TimelineApp.Storage.saveToHistory(evt.target.result);
            TimelineApp.Storage.saveToLocalStorage(evt.target.result);
            parseAndRenderTimeline();
            
            // Update presentation window if open
            if (TimelineApp.Presentation.isOpen()) {
              TimelineApp.Presentation.sendMarkdownUpdate(evt.target.result);
            }
          };
          reader.readAsText(file, "utf-8");
        } else {
          alert("Bitte nur .md oder Text-Dateien ablegen.");
        }
      }
    });
  }

  /**
   * Setup search and filter
   */
  function setupSearchAndFilter() {
    elements.searchInput.addEventListener("input", (e) => {
      const query = e.target.value;
      elements.searchClear.classList.toggle("visible", query.length > 0);

      clearTimeout(searchTimeoutId);
      searchTimeoutId = setTimeout(() => {
        TimelineApp.Search.applySearchAndFilter(query, elements.timelineOutput);
        
        // Update presentation window if open
        if (TimelineApp.Presentation.isOpen()) {
          TimelineApp.Presentation.sendFiltersUpdate();
        }
      }, TimelineApp.Config.SEARCH_DELAY);
    });

    elements.searchClear.addEventListener("click", () => {
      elements.searchInput.value = "";
      elements.searchClear.classList.remove("visible");
      TimelineApp.Search.applySearchAndFilter("", elements.timelineOutput);
      
      // Update presentation window if open
      if (TimelineApp.Presentation.isOpen()) {
        TimelineApp.Presentation.sendFiltersUpdate();
      }
    });

    elements.filterButton.addEventListener("click", (e) => {
      e.stopPropagation();
      elements.filterMenu.classList.toggle("show");
    });

    document.addEventListener("click", (e) => {
      if (!elements.filterMenu.contains(e.target) && e.target !== elements.filterButton) {
        elements.filterMenu.classList.remove("show");
      }
    });

    const filterCheckboxes = elements.filterMenu.querySelectorAll('input[type="checkbox"]');
    filterCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        TimelineApp.Search.toggleFilter(checkbox.value, checkbox.checked);
        TimelineApp.Search.updateFilterButton(elements.filterButton, elements.filterCount);
        TimelineApp.Search.applySearchAndFilter(
          elements.searchInput.value,
          elements.timelineOutput
        );
        
        // Update presentation window if open
        if (TimelineApp.Presentation.isOpen()) {
          TimelineApp.Presentation.sendFiltersUpdate();
        }
      });
    });

    TimelineApp.Search.updateFilterButton(elements.filterButton, elements.filterCount);
  }

  /**
   * Setup modals
   */
  function setupModals() {
    // Statistics Modal
    elements.statsToggle.addEventListener("click", () => {
      const events = TimelineApp.Renderer.getAllEvents();
      TimelineApp.Stats.calculate(events);
      TimelineApp.Stats.render();
      elements.statsModal.classList.add("show");
      elements.statsToggle.classList.add("active");
    });

    elements.statsModalClose.addEventListener("click", () => {
      elements.statsModal.classList.remove("show");
      elements.statsToggle.classList.remove("active");
    });

    // Templates Modal
    elements.templatesToggle.addEventListener("click", () => {
      elements.templatesModal.classList.add("show");
      elements.templatesToggle.classList.add("active");
    });

    elements.templatesModalClose.addEventListener("click", () => {
      elements.templatesModal.classList.remove("show");
      elements.templatesToggle.classList.remove("active");
    });

    // Close on outside click
    elements.statsModal.addEventListener("click", (e) => {
      if (e.target === elements.statsModal) {
        elements.statsModal.classList.remove("show");
        elements.statsToggle.classList.remove("active");
      }
    });

    elements.templatesModal.addEventListener("click", (e) => {
      if (e.target === elements.templatesModal) {
        elements.templatesModal.classList.remove("show");
        elements.templatesToggle.classList.remove("active");
      }
    });
  }

  /**
   * Setup templates
   */
  function setupTemplates() {
    elements.templateGrid.innerHTML = "";

    Object.keys(TimelineApp.Config.TEMPLATES).forEach((key) => {
      const template = TimelineApp.Config.TEMPLATES[key];
      const card = document.createElement("div");
      card.className = "template-card";
      card.innerHTML = `
        <div class="template-title">${template.title}</div>
        <div class="template-description">${template.description}</div>
      `;
      card.addEventListener("click", () => loadTemplate(key));
      elements.templateGrid.appendChild(card);
    });
  }

  /**
   * Load template
   */
  function loadTemplate(key) {
    const template = TimelineApp.Config.TEMPLATES[key];
    if (template) {
      if (
        elements.markdownInput.value.trim() &&
        !confirm("Aktuellen Inhalt überschreiben?")
      ) {
        return;
      }
      elements.markdownInput.value = template.content;
      TimelineApp.Storage.saveToHistory(template.content);
      TimelineApp.Storage.saveToLocalStorage(template.content);
      parseAndRenderTimeline();
      
      // Update presentation window if open
      if (TimelineApp.Presentation.isOpen()) {
        TimelineApp.Presentation.sendMarkdownUpdate(template.content);
      }
      
      elements.templatesModal.classList.remove("show");
      elements.templatesToggle.classList.remove("active");
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
