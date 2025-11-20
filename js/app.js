/**
 * Main Application Logic
 * Coordinates all modules and handles user interactions
 */

(function () {
  "use strict";

  // DOM Elements
  let elements = {};

  // Timeouts
  let debounceTimeoutId;
  let autosaveTimeoutId;
  let searchTimeoutId;

  // Current view mode
  let useSwimlanes = false;

  // Current theme
  let currentTheme = "light";

  /**
   * Initialize application
   */
  function init() {
    cacheDOMElements();
    initImages();
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
   * Initialize image management
   */
  async function initImages() {
    try {
      await TimelineApp.Images.init();
      console.log("Image management initialized");
    } catch (e) {
      console.error("Failed to initialize images:", e);
    }
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
      viewToggle: document.getElementById("viewToggle"), // New view toggle button
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
      templateGrid: document.getElementById("templateGrid"),
    };
  }

  /**
   * Load data from LocalStorage
   */
  function loadFromStorage() {
    const saved = TimelineApp.Storage.loadFromLocalStorage();
    elements.markdownInput.value = saved;
    TimelineApp.Storage.loadHistory();
    
    // Check if a swimlane preference is already set
    const preferenceExists = TimelineApp.Storage.hasSwimlanePreference();
    if (preferenceExists) {
      useSwimlanes = TimelineApp.Storage.loadSwimlanePreference();
    } else {
      // If no preference, decide based on content
      const { body } = TimelineApp.Parser.extractTitleFromMarkdown(saved);
      const events = TimelineApp.Parser.parseEvents(body, 0);
      const uniqueGroups = [...new Set(events.map(event => event.group))];
      
      useSwimlanes = uniqueGroups.length > 1;
      TimelineApp.Storage.saveSwimlanePreference(useSwimlanes); // Save the auto-detected preference
    }
  }

  /**
   * Load and apply theme
   */
  function loadTheme() {
    currentTheme = TimelineApp.Storage.loadTheme();
    applyTheme(currentTheme);
    applyViewPreference(); // Apply view preference after loading from storage
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
   * Apply view preference to button
   */
  function applyViewPreference() {
    if (elements.viewToggle) {
      elements.viewToggle.textContent = useSwimlanes ? "📜" : "🛤️"; // Scroll for list, track for swimlanes
      elements.viewToggle.title = useSwimlanes ? "Listenansicht" : "Swimlane-Ansicht";
      if (useSwimlanes) {
        elements.viewToggle.classList.add("active");
      } else {
        elements.viewToggle.classList.remove("active");
      }
    }
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
   * Toggle view mode (linear vs. swimlanes)
   */
  function toggleView() {
    useSwimlanes = !useSwimlanes;
    TimelineApp.Storage.saveSwimlanePreference(useSwimlanes);
    applyViewPreference();
    parseAndRenderTimeline();

    // Update presentation window if open
    if (TimelineApp.Presentation.isOpen()) {
      TimelineApp.Presentation.sendViewUpdate(useSwimlanes);
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
  async function parseAndRenderTimeline() {
    const success = await TimelineApp.Renderer.renderTimeline(
      elements.markdownInput,
      elements.timelineOutput,
      useSwimlanes // Pass the useSwimlanes flag
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
      elements.visualizeBtn.textContent = "Präsentation schließen";
      elements.visualizeBtn.style.backgroundColor = "#dc3545";
    } else {
      elements.visualizeBtn.textContent = "Präsentation öffnen";
      elements.visualizeBtn.style.backgroundColor = "";
    }
  }

  /**
   * Setup all event listeners
   */
  function setupEventListeners() {
    // Theme toggle
    elements.themeToggle.addEventListener("click", toggleTheme);

    // View toggle
    if (elements.viewToggle) {
      elements.viewToggle.addEventListener("click", toggleView);
    }

    // Visualize button
    elements.visualizeBtn.addEventListener("click", handleVisualize);

    // Markdown input
    elements.markdownInput.addEventListener("input", handleMarkdownInput);

    // File operations
    elements.loadMarkdownBtn.addEventListener("click", async () => {
      // Try using File System Access API first
      if ("showOpenFilePicker" in window) {
        const useFileSystem = confirm(
          "Möchten Sie eine Markdown-Datei mit Bildern laden?\n\n" +
            "Ja = Ordner-basiertes Laden (mit Bildern)\n" +
            "Nein = Einzelne Datei auswählen"
        );

        if (useFileSystem) {
          const markdown = await TimelineApp.Export.loadMarkdownWithImages();
          if (markdown) {
            elements.markdownInput.value = markdown;
            TimelineApp.Storage.saveToHistory(markdown);
            TimelineApp.Storage.saveToLocalStorage(markdown);
            await parseAndRenderTimeline();

            if (TimelineApp.Presentation.isOpen()) {
              TimelineApp.Presentation.sendMarkdownUpdate(markdown);
            }
          }
          return;
        }
      }

      // Fallback to standard file input
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
        TimelineApp.Presentation.sendMarkdownUpdate(
          elements.markdownInput.value
        );
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
  async function handleSaveMarkdown() {
    if (!document.body.classList.contains("fullscreen-mode")) {
      await parseAndRenderTimeline();
    }

    const fullMarkdown = elements.markdownInput.value;
    const hasImages = /!\[([^\]]*)\]\(images\/([^)]+)\)/.test(
      fullMarkdown
    );

    if (hasImages) {
      const useFileSystem = confirm(
        "Diese Timeline enthält Bilder.\n\n" +
          "Möchten Sie mit Bildern speichern? (Chrome/Edge erforderlich)\n\n" +
          "Ja = Ordner mit Markdown + images/\n" +
          "Nein = Nur Markdown-Datei"
      );

      if (useFileSystem) {
        await TimelineApp.Export.exportMarkdownWithImages(
          fullMarkdown,
          elements.timelineOutput,
          getCurrentTitle
        );
        return;
      }
    }

    // Standard markdown export
    TimelineApp.Export.exportMarkdown(
      fullMarkdown,
      elements.timelineOutput,
      getCurrentTitle
    );
  }

  /**
   * Handle save HTML
   */
  async function handleSaveHtml() {
    if (!document.body.classList.contains("fullscreen-mode")) {
      await parseAndRenderTimeline();
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
    if (
      (event.ctrlKey || event.metaKey) &&
      event.key === "z" &&
      !event.shiftKey
    ) {
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
   * Setup drag and drop - FIXED VERSION
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

    elements.markdownInput.addEventListener("drop", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      elements.markdownInput.classList.remove("drag-over");

      const files = e.dataTransfer.files;
      if (files.length === 0) return;

      console.log("Files dropped:", files.length);

      // First, check if there are any images
      const hasImages = Array.from(files).some((file) =>
        file.type.startsWith("image/")
      );

      if (hasImages) {
        // Handle images using the Images module
        console.log("Processing images...");
        const imagesHandled = await TimelineApp.Images.handleDrop(
          e,
          elements.markdownInput
        );

        if (imagesHandled) {
          console.log("Images successfully handled");
          return; // Images were processed, we're done
        }
      }

      // No images or image handling failed - check for markdown files
      const file = files[0];
      console.log("Checking file:", file.name, file.type);

      if (
        file.name.endsWith(".md") ||
        file.type === "text/markdown" ||
        file.type === "text/plain"
      ) {
        console.log("Loading markdown file...");
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
      } else if (!hasImages) {
        // Only show error if it's not an image and not a markdown file
        alert("Bitte nur .md, Text-Dateien oder Bilder ablegen.");
      }
    });

    // Paste event for screenshots
    elements.markdownInput.addEventListener("paste", async (e) => {
      await TimelineApp.Images.handlePaste(e, elements.markdownInput);
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
      if (
        !elements.filterMenu.contains(e.target) &&
        e.target !== elements.filterButton
      ) {
        elements.filterMenu.classList.remove("show");
      }
    });

    const filterCheckboxes = elements.filterMenu.querySelectorAll(
      'input[type="checkbox"]'
    );
    filterCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        TimelineApp.Search.toggleFilter(checkbox.value, checkbox.checked);
        TimelineApp.Search.updateFilterButton(
          elements.filterButton,
          elements.filterCount
        );
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

    TimelineApp.Search.updateFilterButton(
      elements.filterButton,
      elements.filterCount
    );
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
