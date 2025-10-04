/**
 * Search and Filter Module
 */

TimelineApp.Search = {
  activeFilters: new Set(["critical", "warning", "success", "meeting", "work", "none"]),

  /**
   * Apply search and filter to timeline
   */
  applySearchAndFilter(searchQuery, timelineOutputContainer) {
    const query = searchQuery.toLowerCase().trim();
    const timelineItems = timelineOutputContainer.querySelectorAll(".timeline-item");
    let visibleCount = 0;

    timelineItems.forEach((item) => {
      const content = item.querySelector(".timeline-content");
      if (!content) return;

      let eventClass = "none";
      TimelineApp.Config.VALID_EVENT_CLASSES.forEach((cls) => {
        if (content.classList.contains(`is-${cls}`)) {
          eventClass = cls;
        }
      });

      const passesFilter = this.activeFilters.has(eventClass);

      let passesSearch = true;
      if (query) {
        const textContent = item.textContent.toLowerCase();
        passesSearch = textContent.includes(query);

        // Remove existing highlights
        const highlighted = content.querySelectorAll("mark");
        highlighted.forEach((mark) => {
          const parent = mark.parentNode;
          parent.replaceChild(
            document.createTextNode(mark.textContent),
            mark
          );
          parent.normalize();
        });

        // Add new highlights
        if (passesSearch && query.length > 0) {
          this.highlightText(content, query);
        }
      }

      if (passesFilter && passesSearch) {
        item.classList.remove("filtered-out");
        visibleCount++;
      } else {
        item.classList.add("filtered-out");
      }
    });

    // Show no results message if needed
    const existingMessage = timelineOutputContainer.querySelector(".no-results-message");
    if (existingMessage) {
      existingMessage.remove();
    }

    if (visibleCount === 0 && timelineItems.length > 0) {
      const message = document.createElement("div");
      message.className = "no-results-message";
      message.textContent = query
        ? `Keine Ereignisse gefunden für "${query}"`
        : "Keine Ereignisse entsprechen den ausgewählten Filtern";
      timelineOutputContainer.appendChild(message);
    }
  },

  /**
   * Highlight search terms in content
   */
  highlightText(element, query) {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    const nodesToReplace = [];
    let node;

    while ((node = walker.nextNode())) {
      if (node.parentNode.tagName === "MARK") continue;

      const text = node.textContent;
      const lowerText = text.toLowerCase();
      let startIndex = 0;

      while ((startIndex = lowerText.indexOf(query, startIndex)) !== -1) {
        nodesToReplace.push({
          node: node,
          index: startIndex,
          length: query.length
        });
        startIndex += query.length;
      }
    }

    nodesToReplace.reverse().forEach((item) => {
      const { node, index, length } = item;
      const match = node.splitText(index);
      match.splitText(length);
      const mark = document.createElement("mark");
      mark.textContent = match.textContent;
      match.parentNode.replaceChild(mark, match);
    });
  },

  /**
   * Update filter button state
   */
  updateFilterButton(filterButton, filterCount) {
    const totalFilters = 6;
    const activeCount = this.activeFilters.size;

    if (activeCount === totalFilters) {
      filterButton.classList.remove("active");
      filterCount.textContent = "";
    } else {
      filterButton.classList.add("active");
      filterCount.textContent = `(${activeCount})`;
    }
  },

  /**
   * Toggle filter
   */
  toggleFilter(filterValue, isActive) {
    if (isActive) {
      this.activeFilters.add(filterValue);
    } else {
      this.activeFilters.delete(filterValue);
    }
  },

  /**
   * Get active filters
   */
  getActiveFilters() {
    return this.activeFilters;
  }
};
