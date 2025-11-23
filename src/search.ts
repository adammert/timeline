/**
 * Search and Filter Module
 */

import { VALID_EVENT_CLASSES } from './config';
import type { EventType } from './types';

export class Search {
  private activeFilters: Set<string> = new Set([
    'critical',
    'warning',
    'success',
    'meeting',
    'work',
    'info',
    'none',
  ]);

  /**
   * Apply search and filter to timeline
   */
  applySearchAndFilter(searchQuery: string, timelineOutputContainer: HTMLElement): void {
    const query = searchQuery.toLowerCase().trim();
    const timelineItems = timelineOutputContainer.querySelectorAll('.timeline-item');
    let visibleCount = 0;

    timelineItems.forEach((item) => {
      const content = item.querySelector('.timeline-content');
      if (!content) return;

      let eventClass = 'none';
      VALID_EVENT_CLASSES.forEach((cls) => {
        if (content.classList.contains(`is-${cls}`)) {
          eventClass = cls;
        }
      });

      const passesFilter = this.activeFilters.has(eventClass);

      let passesSearch = true;
      if (query) {
        const textContent = (item.textContent || '').toLowerCase();
        passesSearch = textContent.includes(query);

        // Remove existing highlights
        const highlighted = content.querySelectorAll('mark');
        highlighted.forEach((mark) => {
          const parent = mark.parentNode;
          if (parent) {
            parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
            parent.normalize();
          }
        });

        // Add new highlights
        if (passesSearch && query.length > 0) {
          this.highlightText(content, query);
        }
      }

      if (passesFilter && passesSearch) {
        item.classList.remove('filtered-out');
        visibleCount++;
      } else {
        item.classList.add('filtered-out');
      }
    });

    // Show no results message if needed
    const existingMessage = timelineOutputContainer.querySelector('.no-results-message');
    if (existingMessage) {
      existingMessage.remove();
    }

    if (visibleCount === 0 && timelineItems.length > 0) {
      const message = document.createElement('div');
      message.className = 'no-results-message';
      message.textContent = query
        ? `Keine Ereignisse gefunden für "${query}"`
        : 'Keine Ereignisse entsprechen den ausgewählten Filtern';
      timelineOutputContainer.appendChild(message);
    }
  }

  /**
   * Highlight search terms in content
   */
  private highlightText(element: Element, query: string): void {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);

    const nodesToReplace: Array<{ node: Text; index: number; length: number }> = [];
    let node: Node | null;

    while ((node = walker.nextNode())) {
      const textNode = node as Text;
      const parent = textNode.parentNode;
      if (parent && (parent as Element).tagName === 'MARK') continue;

      const text = textNode.textContent || '';
      const lowerText = text.toLowerCase();
      let startIndex = 0;
      let foundIndex: number;

      while ((foundIndex = lowerText.indexOf(query, startIndex)) !== -1) {
        nodesToReplace.push({
          node: textNode,
          index: foundIndex,
          length: query.length,
        });
        startIndex = foundIndex + query.length;
      }
    }

    nodesToReplace.reverse().forEach((item) => {
      const { node, index, length } = item;
      const match = node.splitText(index);
      match.splitText(length);
      const mark = document.createElement('mark');
      mark.textContent = match.textContent;
      const parent = match.parentNode;
      if (parent) {
        parent.replaceChild(mark, match);
      }
    });
  }

  /**
   * Update filter button state
   */
  updateFilterButton(filterButton: HTMLElement, filterCount: HTMLElement): void {
    const totalFilters = 7;
    const activeCount = this.activeFilters.size;

    if (activeCount === totalFilters) {
      filterButton.classList.remove('active');
      filterCount.textContent = '';
    } else {
      filterButton.classList.add('active');
      filterCount.textContent = `(${activeCount})`;
    }
  }

  /**
   * Toggle filter
   */
  toggleFilter(filterValue: string, isActive: boolean): void {
    if (isActive) {
      this.activeFilters.add(filterValue);
    } else {
      this.activeFilters.delete(filterValue);
    }
  }

  /**
   * Get active filters
   */
  getActiveFilters(): Set<string> {
    return this.activeFilters;
  }
}
