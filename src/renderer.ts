/**
 * Timeline Rendering Module
 */

import { marked } from 'marked';
import { Parser } from './parser';
import type { Images } from './images';

interface RawEventData {
  date: Date;
  endDate: Date | null;
  content: string;
  explicitTimeProvided: boolean;
  displayDateString: string | null;
  eventClass: string | null;
  group: string;
  startPos: number;
  endPos: number;
}

export class Renderer {
  private allEvents: RawEventData[] = [];
  private images?: Images;

  constructor(images?: Images) {
    this.images = images;
  }

  /**
   * Render timeline from markdown input
   */
  async renderTimeline(
    markdownInput: HTMLTextAreaElement,
    timelineOutputContainer: HTMLElement,
    showSwimlanes: boolean = false
  ): Promise<boolean> {
    try {
      const fullMarkdown = markdownInput.value;
      const parsedTop = Parser.extractTitleFromMarkdown(fullMarkdown);
      const currentTitle = parsedTop.title;
      const bodyText = parsedTop.body || "";
      const bodyOffset = fullMarkdown.indexOf(bodyText);

      // Clear the container before rendering
      timelineOutputContainer.innerHTML = "";
      // Remove any previous swimlane classes
      timelineOutputContainer.classList.remove("is-swimlanes");
      timelineOutputContainer.style.removeProperty("--num-lanes");

      if (!bodyText.trim()) {
        timelineOutputContainer.innerHTML =
          '<p class="info-message">Bitte gib Daten in das Textfeld ein.</p>';
        this.allEvents = [];
        return false;
      }

      const events = Parser.parseEvents(bodyText, bodyOffset);

      if (events.length === 0) {
        timelineOutputContainer.innerHTML =
          '<p class="info-message">Keine gültigen Ereignisse gefunden.</p>';
        this.allEvents = [];
        return false;
      }

      events.sort((a, b) => a.date.getTime() - b.date.getTime());
      this.allEvents = events;

      const uniqueGroups = [...new Set(events.map(event => event.group))];
      const isSwimlaneMode = showSwimlanes && uniqueGroups.length > 1;

      if (isSwimlaneMode) {
        timelineOutputContainer.classList.add("is-swimlanes");
        timelineOutputContainer.style.setProperty("--num-lanes", String(uniqueGroups.length));
      }

      // Add title if present
      if (currentTitle) {
        const titleEl = document.createElement("h1");
        titleEl.classList.add("timeline-title");
        titleEl.textContent = currentTitle;
        timelineOutputContainer.appendChild(titleEl);
      }

      if (isSwimlaneMode) {
        // Render lane headers
        uniqueGroups.forEach(groupName => {
          const headerDiv = document.createElement("div");
          headerDiv.classList.add("timeline-lane-header");
          headerDiv.textContent = groupName;
          timelineOutputContainer.appendChild(headerDiv);
        });

        // Sort events for swimlane rendering: primary by date, secondary by group
        events.sort((a, b) => {
          if (a.date.getTime() === b.date.getTime()) {
            return uniqueGroups.indexOf(a.group) - uniqueGroups.indexOf(b.group);
          }
          return a.date.getTime() - b.date.getTime();
        });

        // Render each event into its lane
        events.forEach((event, index) => {
          const itemDiv = this.renderEvent(event, index, events, timelineOutputContainer, isSwimlaneMode);
          const groupIndex = uniqueGroups.indexOf(event.group) + 1; // CSS grid columns are 1-indexed
          itemDiv.style.setProperty("--lane-col", String(groupIndex));
          itemDiv.dataset.laneGroup = event.group; // Store group for later processing
          // row is automatically handled by the flow
          timelineOutputContainer.appendChild(itemDiv);
        });

        // Mark last item in each lane to hide connecting line
        this.markLastItemsPerLane(timelineOutputContainer, uniqueGroups);

        // Calculate dynamic connection lines after DOM is fully rendered
        setTimeout(() => {
          this.calculateConnectionLines(timelineOutputContainer);
        }, 100);

        this.addTodayMarker(events, timelineOutputContainer);
      } else {
        // Linear mode rendering
        events.forEach((event, index) => {
          const itemDiv = this.renderEvent(event, index, events, timelineOutputContainer, isSwimlaneMode);
          timelineOutputContainer.appendChild(itemDiv);
        });
        this.addTodayMarker(events, timelineOutputContainer);
      }

      // Check if any actual timeline items were rendered (excluding title and headers)
      const renderedItems = timelineOutputContainer.querySelectorAll(".timeline-item");
      if (renderedItems.length === 0) {
        timelineOutputContainer.innerHTML =
          '<p class="info-message">Keine Ereignisse zum Anzeigen nach der Verarbeitung.</p>';
        return false;
      }

      // Replace image references with actual images from IndexedDB
      if (this.images) {
        await this.images.replaceImageReferences(timelineOutputContainer);
      }

      // Add IntersectionObserver for scroll animations
      if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.1 });

        timelineOutputContainer.querySelectorAll(".timeline-item").forEach(item => {
          observer.observe(item);
        });
      }

      return true;
    } catch (error) {
      console.error("Parse error:", error);
      timelineOutputContainer.innerHTML = `<p class="info-message" style="color: red;">Fehler beim Verarbeiten: ${(error as Error).message}</p>`;
      return false;
    }
  }

  /**
   * Get class-specific styling configuration
   */
  private getClassConfig(eventClass: string | null): {
    borderColor: string;
    glowClass: string;
    gradientFrom: string;
    titleColor: string;
    dotColor: string;
  } {
    const configs: Record<string, {
      borderColor: string;
      glowClass: string;
      gradientFrom: string;
      titleColor: string;
      dotColor: string;
    }> = {
      'is-critical': {
        borderColor: 'border-red-500',
        glowClass: 'dark:shadow-glow-danger',
        gradientFrom: 'from-red-500/10',
        titleColor: 'text-red-500',
        dotColor: 'bg-red-500'
      },
      'is-warning': {
        borderColor: 'border-amber-500',
        glowClass: 'dark:shadow-glow-warning',
        gradientFrom: 'from-amber-500/10',
        titleColor: 'text-amber-500',
        dotColor: 'bg-amber-500'
      },
      'is-success': {
        borderColor: 'border-green-500',
        glowClass: 'dark:shadow-glow-success',
        gradientFrom: 'from-green-500/10',
        titleColor: 'text-green-500',
        dotColor: 'bg-green-500'
      },
      'is-meeting': {
        borderColor: 'border-purple-500',
        glowClass: 'dark:shadow-glow-purple',
        gradientFrom: 'from-purple-500/10',
        titleColor: 'text-purple-500',
        dotColor: 'bg-purple-500'
      },
      'is-work': {
        borderColor: 'border-blue-500',
        glowClass: 'dark:shadow-glow',
        gradientFrom: 'from-blue-500/10',
        titleColor: 'text-blue-500',
        dotColor: 'bg-blue-500'
      }
    };

    return configs[eventClass || ''] || {
      borderColor: 'border-primary',
      glowClass: 'dark:shadow-glow',
      gradientFrom: 'from-primary/10',
      titleColor: 'text-primary',
      dotColor: 'bg-primary'
    };
  }

  /**
   * Render single event
   */
  renderEvent(
    event: RawEventData,
    index: number,
    allEvents: RawEventData[],
    container: HTMLElement,
    _isSwimlaneMode: boolean = false
  ): HTMLDivElement {
    const classConfig = this.getClassConfig(event.eventClass);

    // Main container with group for hover effects
    const itemDiv = document.createElement("div");
    itemDiv.classList.add(
      "timeline-item",
      "relative",
      "pl-16",
      "mb-12",
      "group"
    );
    itemDiv.dataset.startPos = String(event.startPos);
    itemDiv.dataset.endPos = String(event.endPos);

    if (event.endDate) itemDiv.classList.add("has-duration");

    // Timeline dot with hover scale animation
    const dotDiv = document.createElement("div");
    dotDiv.className = `absolute left-[16px] top-6 w-4 h-4 rounded-full ${classConfig.dotColor} border-4 border-white dark:border-background-dark z-10 shadow-lg transform group-hover:scale-125 transition-transform duration-300`;
    itemDiv.appendChild(dotDiv);

    // Duration line for events with end_date
    if (event.endDate && event.date < event.endDate) {
      const durationLine = document.createElement("div");
      durationLine.className = "absolute left-[23px] top-6 bottom-[-60px] w-0.5 bg-blue-500/30 z-0 duration-connector";
      itemDiv.appendChild(durationLine);
    }

    // Date container
    const dateContainerDiv = document.createElement("div");
    dateContainerDiv.className = "mb-2 flex items-center flex-wrap gap-2";

    // Date badge (primary date display)
    const dateBadge = document.createElement("div");
    dateBadge.className = "flex items-center";

    const dateSpan = document.createElement("span");
    dateSpan.className = `${classConfig.titleColor} font-bold text-sm bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded mr-2`;

    if (event.date.getTime() === 0) {
      dateSpan.textContent = "Fehlerhaftes Event";
      dateSpan.className = "text-red-500 font-bold text-sm bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded mr-2";
    } else {
      let formattedDate: string;
      if (event.displayDateString) {
        formattedDate = event.displayDateString;
      } else {
        formattedDate = event.date.toLocaleDateString("de-DE", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit"
        });
        if (event.explicitTimeProvided) {
          formattedDate += " " + event.date.toLocaleTimeString("de-DE", {
            hour: "2-digit",
            minute: "2-digit"
          });
        }
      }
      dateSpan.textContent = formattedDate;
    }
    dateBadge.appendChild(dateSpan);

    // Weekday label
    if (event.date.getTime() !== 0) {
      const weekdayLabel = this.getWeekdayLabel(event.date);
      if (weekdayLabel) {
        const weekdaySpan = document.createElement("span");
        weekdaySpan.className = "text-gray-500 dark:text-gray-400 text-sm";
        weekdaySpan.textContent = `(${weekdayLabel})`;
        dateBadge.appendChild(weekdaySpan);
      }
    }

    dateContainerDiv.appendChild(dateBadge);

    // Duration badge for events with end_date
    if (event.endDate && event.date.getTime() !== 0) {
      const durationBadge = document.createElement("span");
      durationBadge.className = "text-xs bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full";
      durationBadge.textContent = Parser.calculateDuration(event.date, event.endDate);
      dateContainerDiv.appendChild(durationBadge);
    }

    itemDiv.appendChild(dateContainerDiv);

    // Content card with gradient overlay and glow effect
    const contentDiv = document.createElement("div");
    contentDiv.className = `timeline-content bg-white dark:bg-surface-dark rounded-xl p-5 border-l-4 ${classConfig.borderColor} shadow-md hover:shadow-xl ${classConfig.glowClass} transition-all duration-300 relative overflow-hidden`;
    if (event.eventClass) contentDiv.classList.add(event.eventClass);

    // Gradient overlay
    const gradientOverlay = document.createElement("div");
    gradientOverlay.className = `absolute inset-0 bg-gradient-to-r ${classConfig.gradientFrom} to-transparent pointer-events-none`;
    contentDiv.appendChild(gradientOverlay);

    // Content wrapper (for z-index over gradient)
    const contentWrapper = document.createElement("div");
    contentWrapper.className = "relative z-10";

    // Create temporary container for parsing
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = marked.parse(event.content || "Kein Inhalt.") as string;

    // Style headings with class-specific colors
    const headings = tempDiv.querySelectorAll('h1, h2, h3');
    headings.forEach(heading => {
      heading.classList.add('font-bold', 'mb-2', classConfig.titleColor);
      if (heading.tagName === 'H1' || heading.tagName === 'H2') {
        heading.classList.add('text-xl');
      } else {
        heading.classList.add('text-lg');
      }
    });

    // Style paragraphs (spacing handled by CSS in tailwind.css)
    const paragraphs = tempDiv.querySelectorAll('p');
    paragraphs.forEach(p => {
      p.classList.add('text-gray-600', 'dark:text-gray-300');
    });

    // Style lists (list-style and indentation handled by CSS in tailwind.css)
    const lists = tempDiv.querySelectorAll('ul, ol');
    lists.forEach(list => {
      list.classList.add('text-gray-600', 'dark:text-gray-300');
    });

    // Find and replace all images with images/ prefix BEFORE adding to DOM
    const images = tempDiv.querySelectorAll('img');
    images.forEach(img => {
      const src = img.getAttribute('src');
      if (src && src.startsWith('images/')) {
        const filename = src.replace('images/', '');
        img.setAttribute('src', 'data:image/gif;base64,R0lGODlhAQABAAAAACw=');
        img.setAttribute('data-filename', filename);
        img.style.display = 'none';
      }
      img.classList.add('rounded-lg', 'mt-2');
    });

    // Now move the processed content to the content wrapper
    while (tempDiv.firstChild) {
      contentWrapper.appendChild(tempDiv.firstChild);
    }

    contentDiv.appendChild(contentWrapper);
    itemDiv.appendChild(contentDiv);

    // Add duration bar if end date exists (for legacy compatibility)
    if (event.endDate && event.date < event.endDate) {
      setTimeout(() => {
        this.renderDurationBar(itemDiv, event, index, allEvents, container);
      }, 50);
    }
    return itemDiv;
  }

  /**
   * Helper: return localized weekday name
   */
  getWeekdayLabel(date: Date): string {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return "";
    }

    try {
      return date.toLocaleDateString('de-DE', { weekday: 'long' });
    } catch (error) {
      console.warn('Failed to format weekday', error);
      return "";
    }
  }

  /**
   * Render duration bar between start and end dates
   */
  renderDurationBar(
    startItem: HTMLDivElement,
    event: RawEventData,
    sortedIndex: number,
    allEvents: RawEventData[],
    container: HTMLElement
  ): void {
    const allItems = container.querySelectorAll(".timeline-item");
    if (!startItem) return;

    let endItem: Element | null = null;
    let endPositionTop = -1;

    for (let i = sortedIndex + 1; i < allEvents.length; i++) {
      const currentEvent = allEvents[i];
      if (currentEvent && currentEvent.date >= event.endDate!) {
        endItem = (allItems[i] as Element | undefined) || null;
        break;
      }
    }

    const startTop = (startItem as HTMLElement).offsetTop;
    if (endItem) {
      endPositionTop = (endItem as HTMLElement).offsetTop;
    } else {
      const lastItem = allItems[allItems.length - 1];
      if (lastItem) {
        endPositionTop = (lastItem as HTMLElement).offsetTop + (lastItem as HTMLElement).offsetHeight;
      }
    }

    if (endPositionTop > startTop) {
      const height = endPositionTop - startTop;
      if (height > 20) {
        const durationBar = document.createElement("div");
        durationBar.classList.add("duration-bar");
        durationBar.style.height = height - 2 + "px";
        startItem.appendChild(durationBar);

        const endMarker = document.createElement("div");
        endMarker.classList.add("duration-end-marker");
        endMarker.style.top = height + "px";
        startItem.appendChild(endMarker);
      }
    }
  }

  /**
   * Mark the last item in each swimlane to hide the connecting line
   */
  markLastItemsPerLane(container: HTMLElement, _groups?: string[]): void {
    const timelineItems = container.querySelectorAll(".timeline-item");

    // Find last item for each group
    const lastItemsPerGroup: Record<string, Element> = {};
    timelineItems.forEach(item => {
      const group = (item as HTMLElement).dataset.laneGroup;
      if (group) {
        lastItemsPerGroup[group] = item;
      }
    });

    // Mark last items
    Object.values(lastItemsPerGroup).forEach(item => {
      item.classList.add("lane-last-item");
    });
  }

  /**
   * Calculate and set dynamic connection line heights for swimlane items
   */
  calculateConnectionLines(container: HTMLElement): void {
    const timelineItems = Array.from(container.querySelectorAll(".timeline-item"));

    // Group items by lane
    const itemsByLane: Record<string, HTMLElement[]> = {};
    timelineItems.forEach(item => {
      const group = (item as HTMLElement).dataset.laneGroup;
      if (group) {
        if (!itemsByLane[group]) {
          itemsByLane[group] = [];
        }
        itemsByLane[group].push(item as HTMLElement);
      }
    });

    // For each lane, calculate connection line heights
    Object.keys(itemsByLane).forEach(group => {
      const laneItems = itemsByLane[group];
      if (!laneItems || laneItems.length < 2) return;

      for (let i = 0; i < laneItems.length - 1; i++) {
        const currentItem = laneItems[i];
        const nextItem = laneItems[i + 1];
        if (!currentItem || !nextItem) continue;

        // Calculate vertical distance between current item and next item in same lane
        const currentTop = currentItem.offsetTop;
        const nextTop = nextItem.offsetTop;
        const distance = nextTop - currentTop;

        // Set CSS variable for connection line height
        // Subtract 29px (top offset of ::after) to get the correct height
        const lineHeight = distance - 29;
        if (lineHeight > 0) {
          currentItem.style.setProperty('--connection-line-height', `${lineHeight}px`);
        }
      }
    });
  }

  /**
   * Add today marker to timeline
   */
  addTodayMarker(events: RawEventData[], container: HTMLElement): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const validEvents = events.filter(
      (e) => e.date.getTime() !== new Date(0).getTime()
    );
    if (validEvents.length === 0) return;

    let insertIndex = -1;

    for (let i = 0; i < validEvents.length; i++) {
      const event = validEvents[i];
      if (!event) continue;
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);

      if (eventDate >= today) {
        insertIndex = i;
        break;
      }
    }

    if (insertIndex === -1) {
      insertIndex = validEvents.length;
    }

    const timelineItems = container.querySelectorAll(".timeline-item");

    const todayMarker = document.createElement("div");
    todayMarker.classList.add("current-date-marker");
    todayMarker.style.display = "block";

    const todayLabel = document.createElement("span");
    todayLabel.classList.add("current-date-marker-label");
    todayLabel.textContent = "Heute";
    todayMarker.appendChild(todayLabel);

    let targetNode: Element | null = null;
    if (insertIndex < timelineItems.length) {
      targetNode = timelineItems[insertIndex] || null;
    }

    if (targetNode) {
      container.insertBefore(todayMarker, targetNode);
    } else {
      container.appendChild(todayMarker);
    }
  }

  /**
   * Scroll to source position in editor
   */
  scrollToSource(start: number, end: number, markdownInput: HTMLTextAreaElement): void {
    if (document.body.classList.contains("fullscreen-mode")) {
      document.body.classList.remove("fullscreen-mode");
    }

    markdownInput.focus();

    // Create mirror div for accurate position calculation
    const mirror = document.createElement("div");
    const style = window.getComputedStyle(markdownInput);

    [
      "fontFamily",
      "fontSize",
      "fontWeight",
      "fontStyle",
      "letterSpacing",
      "lineHeight",
      "textTransform",
      "wordSpacing",
      "paddingTop",
      "paddingRight",
      "paddingBottom",
      "paddingLeft",
      "borderTopWidth",
      "borderRightWidth",
      "borderBottomWidth",
      "borderLeftWidth",
      "boxSizing",
      "whiteSpace",
      "wordWrap"
    ].forEach((prop) => {
      (mirror.style as any)[prop] = (style as any)[prop];
    });

    mirror.style.width = `${markdownInput.clientWidth}px`;
    mirror.style.position = "absolute";
    mirror.style.left = "-9999px";
    mirror.style.top = "0";
    mirror.style.pointerEvents = "none";
    mirror.style.visibility = "hidden";

    mirror.textContent = markdownInput.value.substring(0, start);

    const positionMarker = document.createElement("span");
    positionMarker.innerHTML = ".";
    mirror.appendChild(positionMarker);

    document.body.appendChild(mirror);
    const targetScrollTop = positionMarker.offsetTop;
    document.body.removeChild(mirror);

    markdownInput.scrollTop = targetScrollTop;

    // Highlight selection
    const text = markdownInput.value.substring(start, end);
    const trimmedText = text.trim();
    const startOffset = text.indexOf(trimmedText);

    if (startOffset > -1) {
      markdownInput.setSelectionRange(
        start + startOffset,
        start + startOffset + trimmedText.length
      );
    } else {
      markdownInput.setSelectionRange(start, end);
    }

    markdownInput.classList.add("highlight-scroll");
    setTimeout(() => {
      markdownInput.classList.remove("highlight-scroll");
    }, 1000);
  }

  /**
   * Get all events
   */
  getAllEvents(): RawEventData[] {
    return this.allEvents;
  }
}
