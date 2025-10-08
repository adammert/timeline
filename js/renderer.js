/**
 * Timeline Rendering Module
 */

TimelineApp.Renderer = {
  allEvents: [],
  cachedLineHeight: 0,

  /**
   * Render timeline from markdown input
   */
  async renderTimeline(markdownInput, timelineOutputContainer) {
    try {
      const fullMarkdown = markdownInput.value;
      const parsedTop = TimelineApp.Parser.extractTitleFromMarkdown(fullMarkdown);
      const currentTitle = parsedTop.title;
      const bodyText = parsedTop.body || "";
      const bodyOffset = fullMarkdown.indexOf(bodyText);

      if (!bodyText.trim()) {
        timelineOutputContainer.innerHTML =
          '<p class="info-message">Bitte gib Daten in das Textfeld ein.</p>';
        this.allEvents = [];
        return false;
      }

      const events = TimelineApp.Parser.parseEvents(bodyText, bodyOffset);

      if (events.length === 0) {
        timelineOutputContainer.innerHTML =
          '<p class="info-message">Keine gültigen Ereignisse gefunden.</p>';
        this.allEvents = [];
        return false;
      }

      events.sort((a, b) => a.date - b.date);
      this.allEvents = events;
      timelineOutputContainer.innerHTML = "";

      // Add title if present
      if (currentTitle) {
        const titleEl = document.createElement("h1");
        titleEl.classList.add("timeline-title");
        titleEl.textContent = currentTitle;
        timelineOutputContainer.appendChild(titleEl);
      }

      // Render each event
      events.forEach((event, index) => {
        this.renderEvent(event, index, events, timelineOutputContainer);
      });

      if (timelineOutputContainer.innerHTML === "") {
        timelineOutputContainer.innerHTML =
          '<p class="info-message">Keine Ereignisse zum Anzeigen nach der Verarbeitung.</p>';
        return false;
      }

      this.addTodayMarker(events, timelineOutputContainer);
      
      // Replace image references with actual images from IndexedDB
      if (TimelineApp.Images) {
        await TimelineApp.Images.replaceImageReferences(timelineOutputContainer);
      }
      
      return true;
    } catch (error) {
      console.error("Parse error:", error);
      timelineOutputContainer.innerHTML = `<p class="info-message" style="color: red;">Fehler beim Verarbeiten: ${error.message}</p>`;
      return false;
    }
  },

  /**
   * Render single event
   */
  renderEvent(event, index, allEvents, container) {
    const itemDiv = document.createElement("div");
    itemDiv.classList.add("timeline-item");
    itemDiv.dataset.startPos = event.startPos;
    itemDiv.dataset.endPos = event.endPos;

    if (event.endDate) itemDiv.classList.add("has-duration");

    const dateDiv = document.createElement("div");
    dateDiv.classList.add("timeline-date");

    if (event.date.getTime() === 0) {
      dateDiv.textContent = "Fehlerhaftes Event";
      dateDiv.style.color = "red";
    } else if (event.displayDateString) {
      dateDiv.textContent = event.displayDateString;
    } else {
      let formattedDate = event.date.toLocaleDateString("de-DE", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      });
      if (event.explicitTimeProvided) {
        formattedDate +=
          " " +
          event.date.toLocaleTimeString("de-DE", {
            hour: "2-digit",
            minute: "2-digit"
          });
      }
      dateDiv.textContent = formattedDate;
    }

    if (event.endDate && event.date.getTime() !== 0) {
      const durationSpan = document.createElement("span");
      durationSpan.className = "duration-label";
      durationSpan.textContent = TimelineApp.Parser.calculateDuration(
        event.date,
        event.endDate
      );
      dateDiv.appendChild(durationSpan);
    }

    const contentDiv = document.createElement("div");
    contentDiv.classList.add("timeline-content");
    if (event.eventClass) contentDiv.classList.add(event.eventClass);
    
    // Create temporary container for parsing
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = marked.parse(event.content || "Kein Inhalt.");
    
    // Find and replace all images with images/ prefix BEFORE adding to DOM
    const images = tempDiv.querySelectorAll('img');
    images.forEach(img => {
      const src = img.getAttribute('src');
      if (src && src.startsWith('images/')) {
        const filename = src.replace('images/', '');
        // Set placeholder and data attribute
        img.setAttribute('src', 'data:image/gif;base64,R0lGODlhAQABAAAAACw=');
        img.setAttribute('data-filename', filename);
        img.style.display = 'none';
      }
    });
    
    // Now move the processed content to the actual contentDiv
    while (tempDiv.firstChild) {
      contentDiv.appendChild(tempDiv.firstChild);
    }

    itemDiv.appendChild(dateDiv);
    itemDiv.appendChild(contentDiv);
    container.appendChild(itemDiv);

    // Add duration bar if end date exists
    if (event.endDate && event.date < event.endDate) {
      setTimeout(() => {
        this.renderDurationBar(itemDiv, event, index, allEvents, container);
      }, 50);
    }
  },

  /**
   * Render duration bar between start and end dates
   */
  renderDurationBar(startItem, event, sortedIndex, allEvents, container) {
    const allItems = container.querySelectorAll(".timeline-item");
    if (!startItem) return;

    let endItem = null;
    let endPositionTop = -1;

    for (let i = sortedIndex + 1; i < allEvents.length; i++) {
      if (allEvents[i].date >= event.endDate) {
        endItem = allItems[i];
        break;
      }
    }

    const startTop = startItem.offsetTop;
    if (endItem) {
      endPositionTop = endItem.offsetTop;
    } else {
      const lastItem = allItems[allItems.length - 1];
      if (lastItem) {
        endPositionTop = lastItem.offsetTop + lastItem.offsetHeight;
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
  },

  /**
   * Add today marker to timeline
   */
  addTodayMarker(events, container) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const validEvents = events.filter(
      (e) => e.date.getTime() !== new Date(0).getTime()
    );
    if (validEvents.length === 0) return;

    let insertIndex = -1;

    for (let i = 0; i < validEvents.length; i++) {
      const eventDate = new Date(validEvents[i].date);
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

    let targetNode = null;
    if (insertIndex < timelineItems.length) {
      targetNode = timelineItems[insertIndex];
    }

    if (targetNode) {
      container.insertBefore(todayMarker, targetNode);
    } else {
      container.appendChild(todayMarker);
    }
  },

  /**
   * Scroll to source position in editor
   */
  scrollToSource(start, end, markdownInput) {
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
      mirror.style[prop] = style[prop];
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
  },

  /**
   * Get all events
   */
  getAllEvents() {
    return this.allEvents;
  }
};
