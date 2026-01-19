/**
 * Presentation Window Entry Point
 */

import '../src/styles/styles.css';
import { Parser } from './parser';
import { Images } from './images';
import { marked } from 'marked';

// Presentation Window Script
(function () {
  const timelineOutput = document.getElementById('timelineOutput') as HTMLElement;
  const statusIndicator = document.getElementById('statusIndicator') as HTMLElement;
  const statusText = document.getElementById('statusText') as HTMLElement;

  let channel: BroadcastChannel | null = null;
  let lastUpdate = Date.now();
  let connectionCheckInterval: number | null = null;
  let activeFilters = new Set(['critical', 'warning', 'success', 'meeting', 'work', 'info', 'none']);
  let currentSearchQuery = '';
  const imagesService = new Images();

  /**
   * Initialize BroadcastChannel
   */
  function initChannel(): void {
    try {
      channel = new BroadcastChannel('timeline_presentation');

      channel.onmessage = (event: MessageEvent) => {
        lastUpdate = Date.now();
        updateConnectionStatus(true);

        if (event.data.type === 'update') {
          renderTimeline(event.data.markdown);
        } else if (event.data.type === 'ping') {
          channel?.postMessage({ type: 'pong' });
        } else if (event.data.type === 'theme') {
          applyTheme(event.data.theme);
        } else if (event.data.type === 'filters') {
          activeFilters = new Set(event.data.filters);
          currentSearchQuery = event.data.searchQuery || '';
          applySearchAndFilter();
        } else if (event.data.type === 'init') {
          applyTheme(event.data.theme);
          if (event.data.filters) {
            activeFilters = new Set(event.data.filters);
          }
          if (event.data.searchQuery) {
            currentSearchQuery = event.data.searchQuery;
          }
          renderTimeline(event.data.markdown);
        }
      };

      channel.postMessage({ type: 'request_data' });

      connectionCheckInterval = window.setInterval(() => {
        const timeSinceLastUpdate = Date.now() - lastUpdate;
        if (timeSinceLastUpdate > 5000) {
          updateConnectionStatus(false);
        }
      }, 2000);
    } catch (e) {
      console.error('BroadcastChannel nicht unterstützt:', e);
      timelineOutput.innerHTML =
        '<div class="loading-message">Fehler: BroadcastChannel API nicht unterstützt.</div>';
    }
  }

  /**
   * Apply search and filter to timeline
   */
  function applySearchAndFilter(): void {
    const timelineItems = timelineOutput.querySelectorAll('.timeline-item');
    let visibleCount = 0;

    timelineItems.forEach((item) => {
      const content = item.querySelector('.timeline-content');
      if (!content) return;

      let eventClass = 'none';
      const validClasses = ['critical', 'warning', 'success', 'meeting', 'work', 'info'];
      validClasses.forEach((cls) => {
        if (content.classList.contains(`is-${cls}`)) {
          eventClass = cls;
        }
      });

      const passesFilter = activeFilters.has(eventClass);

      let passesSearch = true;
      if (currentSearchQuery) {
        const textContent = (item.textContent || '').toLowerCase();
        passesSearch = textContent.includes(currentSearchQuery.toLowerCase());
      }

      if (passesFilter && passesSearch) {
        item.classList.remove('filtered-out');
        visibleCount++;
      } else {
        item.classList.add('filtered-out');
      }
    });

    const existingMessage = timelineOutput.querySelector('.no-results-message');
    if (existingMessage) {
      existingMessage.remove();
    }

    if (visibleCount === 0 && timelineItems.length > 0) {
      const message = document.createElement('div');
      message.className = 'no-results-message';
      message.textContent = currentSearchQuery
        ? `Keine Ereignisse gefunden für "${currentSearchQuery}"`
        : 'Keine Ereignisse entsprechen den ausgewählten Filtern';
      message.style.textAlign = 'center';
      message.style.padding = '60px 20px';
      message.style.color = 'var(--secondary-color)';
      message.style.fontSize = '1.3em';
      timelineOutput.appendChild(message);
    }
  }

  /**
   * Apply theme to presentation window
   */
  function applyTheme(theme: string): void {
    if (!theme) return;
    document.documentElement.setAttribute('data-theme', theme);
  }

  /**
   * Update connection status indicator
   */
  function updateConnectionStatus(connected: boolean): void {
    if (connected) {
      statusIndicator.classList.remove('disconnected');
      statusText.textContent = 'Verbunden';
    } else {
      statusIndicator.classList.add('disconnected');
      statusText.textContent = 'Getrennt';
    }
  }

  /**
   * Render timeline from markdown
   */
  async function renderTimeline(markdown: string): Promise<void> {
    if (!markdown || !markdown.trim()) {
      timelineOutput.innerHTML = '<div class="loading-message">Keine Daten vorhanden.</div>';
      return;
    }

    const parsed = Parser.extractTitleFromMarkdown(markdown);
    const currentTitle = parsed.title;
    const bodyText = parsed.body || '';
    const bodyOffset = markdown.indexOf(bodyText);

    if (!bodyText.trim()) {
      timelineOutput.innerHTML =
        '<div class="loading-message">Bitte gib Daten im Hauptfenster ein.</div>';
      return;
    }

    const events = Parser.parseEvents(bodyText, bodyOffset);

    if (events.length === 0) {
      timelineOutput.innerHTML =
        '<div class="loading-message">Keine gültigen Ereignisse gefunden.</div>';
      return;
    }

    events.sort((a, b) => a.date.getTime() - b.date.getTime());
    timelineOutput.innerHTML = '';

    if (currentTitle) {
      const titleEl = document.createElement('h1');
      titleEl.classList.add('timeline-title');
      titleEl.textContent = currentTitle;
      timelineOutput.appendChild(titleEl);
    }

    events.forEach((event, index) => {
      renderEvent(event, index, events);
    });

    addTodayMarker(events);

    setTimeout(async () => {
      addDurationBars(events);
      await imagesService.replaceImageReferences(timelineOutput);
      applySearchAndFilter();
    }, 50);
  }

  /**
   * Helper: return localized weekday name
   */
  function getWeekdayLabel(date: Date): string {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return '';
    }

    try {
      return date.toLocaleDateString('de-DE', { weekday: 'long' });
    } catch (error) {
      console.warn('Failed to format weekday', error);
      return '';
    }
  }

  /**
   * Render single event
   */
  function renderEvent(event: any, index: number, _allEvents: any[]): void {
    const itemDiv = document.createElement('div');
    itemDiv.classList.add('timeline-item');
    if (event.endDate) itemDiv.classList.add('has-duration');

    const dateDiv = document.createElement('div');
    dateDiv.classList.add('timeline-date');

    if (event.date.getTime() === 0) {
      dateDiv.textContent = 'Fehlerhaftes Event';
      dateDiv.style.color = 'red';
    } else {
      const weekdayLabel = getWeekdayLabel(event.date);

      if (event.displayDateString) {
        dateDiv.textContent = weekdayLabel
          ? event.displayDateString + ' (' + weekdayLabel + ')'
          : event.displayDateString;
      } else {
        let formattedDate = event.date.toLocaleDateString('de-DE', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });
        if (event.explicitTimeProvided) {
          formattedDate +=
            ' ' +
            event.date.toLocaleTimeString('de-DE', {
              hour: '2-digit',
              minute: '2-digit',
            });
        }
        if (weekdayLabel) {
          formattedDate += ' (' + weekdayLabel + ')';
        }
        dateDiv.textContent = formattedDate;
      }
    }

    if (event.endDate && event.date.getTime() !== 0) {
      const durationSpan = document.createElement('span');
      durationSpan.className = 'duration-label';
      durationSpan.textContent = Parser.calculateDuration(event.date, event.endDate);
      dateDiv.appendChild(durationSpan);
    }

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('timeline-content');
    if (event.eventClass) contentDiv.classList.add(event.eventClass);

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = marked.parse(event.content || 'Kein Inhalt.') as string;

    const images = tempDiv.querySelectorAll('img');
    images.forEach((img) => {
      const src = img.getAttribute('src');
      if (src && src.startsWith('images/')) {
        const filename = src.replace('images/', '');
        img.setAttribute('src', 'data:image/gif;base64,R0lGODlhAQABAAAAACw=');
        img.setAttribute('data-filename', filename);
        img.style.display = 'none';
      }
    });

    while (tempDiv.firstChild) {
      contentDiv.appendChild(tempDiv.firstChild);
    }

    itemDiv.appendChild(dateDiv);
    itemDiv.appendChild(contentDiv);
    itemDiv.dataset.index = String(index);
    timelineOutput.appendChild(itemDiv);
  }

  /**
   * Add duration bars
   */
  function addDurationBars(events: any[]): void {
    const allItems = timelineOutput.querySelectorAll('.timeline-item');

    events.forEach((event, index) => {
      if (!event.endDate || event.date >= event.endDate) return;

      const startItem = allItems[index] as HTMLElement;
      if (!startItem) return;

      let endItem: HTMLElement | null = null;
      let endPositionTop = -1;

      for (let i = index + 1; i < events.length; i++) {
        if (events[i]?.date >= event.endDate) {
          endItem = allItems[i] as HTMLElement;
          break;
        }
      }

      const startTop = startItem.offsetTop;
      if (endItem) {
        endPositionTop = endItem.offsetTop;
      } else {
        const lastItem = allItems[allItems.length - 1] as HTMLElement;
        if (lastItem) {
          endPositionTop = lastItem.offsetTop + lastItem.offsetHeight;
        }
      }

      if (endPositionTop > startTop) {
        const height = endPositionTop - startTop;
        if (height > 20) {
          const durationBar = document.createElement('div');
          durationBar.classList.add('duration-bar');
          durationBar.style.height = height - 2 + 'px';
          startItem.appendChild(durationBar);

          const endMarker = document.createElement('div');
          endMarker.classList.add('duration-end-marker');
          endMarker.style.top = height + 'px';
          startItem.appendChild(endMarker);
        }
      }
    });
  }

  /**
   * Add today marker
   */
  function addTodayMarker(events: any[]): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const validEvents = events.filter((e) => e.date.getTime() !== new Date(0).getTime());
    if (validEvents.length === 0) return;

    let insertIndex = -1;

    for (let i = 0; i < validEvents.length; i++) {
      const eventDate = new Date(validEvents[i]?.date);
      eventDate.setHours(0, 0, 0, 0);

      if (eventDate >= today) {
        insertIndex = i;
        break;
      }
    }

    if (insertIndex === -1) {
      insertIndex = validEvents.length;
    }

    const timelineItems = timelineOutput.querySelectorAll('.timeline-item');

    const todayMarker = document.createElement('div');
    todayMarker.classList.add('current-date-marker');
    todayMarker.style.display = 'block';

    const todayLabel = document.createElement('span');
    todayLabel.classList.add('current-date-marker-label');
    todayLabel.textContent = 'Heute';
    todayMarker.appendChild(todayLabel);

    let targetNode: Element | null = null;
    if (insertIndex < timelineItems.length) {
      targetNode = timelineItems[insertIndex] || null;
    }

    if (targetNode) {
      timelineOutput.insertBefore(todayMarker, targetNode);
    } else {
      timelineOutput.appendChild(todayMarker);
    }
  }

  // Handle window close
  window.addEventListener('beforeunload', () => {
    if (channel) {
      channel.postMessage({ type: 'presentation_closed' });
      channel.close();
    }
    if (connectionCheckInterval !== null) {
      clearInterval(connectionCheckInterval);
    }
  });

  // Initialize
  async function initPresentation(): Promise<void> {
    await imagesService.init();
    initChannel();
  }

  initPresentation();
})();
