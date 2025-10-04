/**
 * Date and Event Parsing Module
 */

TimelineApp.Parser = {
  /**
   * Extract title from markdown
   */
  extractTitleFromMarkdown(text) {
    if (!text) return { title: null, body: "" };
    const lines = String(text).replace(/\r\n/g, "\n").split("\n");
    let title = null;
    let consumedIndex = -1;

    let i = 0;
    while (i < lines.length && lines[i].trim() === "") i++;

    if (i < lines.length) {
      const line = lines[i];
      let m = line.match(/^\s*title:\s*(.+)\s*$/i);
      if (m && m[1].trim()) {
        title = m[1].trim();
        consumedIndex = i;
      } else {
        m = line.match(/^\s*#{1,6}\s+(.+)\s*$/);
        if (m && m[1].trim()) {
          title = m[1].trim();
          consumedIndex = i;
        }
      }
    }

    let body;
    if (consumedIndex >= 0) {
      const remaining = lines
        .slice(0, consumedIndex)
        .concat(lines.slice(consumedIndex + 1));
      body = remaining.join("\n");
    } else {
      body = lines.join("\n");
    }
    return { title, body };
  },

  /**
   * Parse date string with multiple format support
   */
  parseDate(dateString) {
    let parsedDateObject = null;
    let displayDateString = null;
    let hasTime = false;

    // Check for Quarter format (Q1 2025 or 2025 Q1)
    let quarterMatch = dateString.match(/^(Q([1-4]))\s*(\d{4})$/i);
    if (!quarterMatch) {
      quarterMatch = dateString.match(/^(\d{4})\s*(Q([1-4]))$/i);
      if (quarterMatch) {
        quarterMatch = [
          quarterMatch[0],
          quarterMatch[2],
          quarterMatch[3],
          quarterMatch[1]
        ];
      }
    }
    if (quarterMatch) {
      const quarter = parseInt(quarterMatch[2]);
      const year = parseInt(quarterMatch[3]);
      parsedDateObject = new Date(year, (quarter - 1) * 3, 1);
      displayDateString = `Q${quarter} ${year}`;
      return {
        date: parsedDateObject,
        displayString: displayDateString,
        hasTime: false
      };
    }

    // Check for month name format (Januar 2025 or 2025 Januar)
    let monthNameMatch = dateString.match(
      /^([a-zA-ZäöüÄÖÜß]+)\s*(\d{4})$/i
    );
    if (!monthNameMatch) {
      monthNameMatch = dateString.match(/^(\d{4})\s*([a-zA-ZäöüÄÖÜß]+)$/i);
      if (monthNameMatch) {
        monthNameMatch = [
          monthNameMatch[0],
          monthNameMatch[2],
          monthNameMatch[1]
        ];
      }
    }
    if (monthNameMatch) {
      const monthName = monthNameMatch[1].toLowerCase();
      const year = parseInt(monthNameMatch[2]);
      if (TimelineApp.Config.MONTH_NAME_TO_INDEX.hasOwnProperty(monthName)) {
        parsedDateObject = new Date(
          year,
          TimelineApp.Config.MONTH_NAME_TO_INDEX[monthName],
          1
        );
        displayDateString = `${
          monthNameMatch[1].charAt(0).toUpperCase() +
          monthNameMatch[1].slice(1)
        } ${year}`;
        return {
          date: parsedDateObject,
          displayString: displayDateString,
          hasTime: false
        };
      }
    }

    // Try standard Date constructor
    try {
      parsedDateObject = new Date(dateString);
      if (isNaN(parsedDateObject.getTime())) {
        throw new Error("Invalid date format.");
      }
      hasTime = dateString.includes(":");
      return {
        date: parsedDateObject,
        displayString: null,
        hasTime: hasTime
      };
    } catch (e) {
      // Try German date format (DD.MM.YYYY)
      const germanDateMatch = dateString.match(
        /^(\d{1,2})\.(\d{1,2})\.(\d{4})/
      );
      if (germanDateMatch) {
        const day = parseInt(germanDateMatch[1], 10);
        const month = parseInt(germanDateMatch[2], 10) - 1;
        const year = parseInt(germanDateMatch[3], 10);
        let timeParts = [0, 0, 0];
        const timeMatch = dateString.match(
          /(\d{1,2}):(\d{1,2})(:(\d{1,2}))?/
        );
        if (timeMatch) {
          timeParts[0] = parseInt(timeMatch[1], 10);
          timeParts[1] = parseInt(timeMatch[2], 10);
          if (timeMatch[4]) {
            timeParts[2] = parseInt(timeMatch[4], 10);
          }
          hasTime = true;
        }
        parsedDateObject = new Date(year, month, day, ...timeParts);
        if (!isNaN(parsedDateObject.getTime())) {
          return {
            date: parsedDateObject,
            displayString: null,
            hasTime: hasTime
          };
        }
      }

      console.warn(`Date parsing failed for: "${dateString}"`);
      return { date: null, displayString: null, hasTime: false };
    }
  },

  /**
   * Parse markdown into events
   */
  parseEvents(bodyText, bodyOffset) {
    const eventBlocks = [];
    const separatorRegex = /(\r\n---\r\n|\n---\n|\r---\r)/g;
    let lastIndex = 0;
    let match;

    while ((match = separatorRegex.exec(bodyText)) !== null) {
      const eventStr = bodyText.substring(lastIndex, match.index);
      if (eventStr.trim()) {
        eventBlocks.push({
          text: eventStr,
          start: bodyOffset + lastIndex,
          end: bodyOffset + match.index
        });
      }
      lastIndex = separatorRegex.lastIndex;
    }

    const lastEventStr = bodyText.substring(lastIndex);
    if (lastEventStr.trim()) {
      eventBlocks.push({
        text: lastEventStr,
        start: bodyOffset + lastIndex,
        end: bodyOffset + bodyText.length
      });
    }

    const events = [];
    eventBlocks.forEach((block) => {
      const eventStr = block.text;
      const lines = eventStr.trim().split("\n");
      let dateStringFromInput = null,
        endDateStringFromInput = null,
        explicitTimeInInput = false,
        displayDateString = null,
        parsedDateObject = null,
        parsedEndDateObject = null,
        eventClass = null;
      let contentLines = [];

      for (const line of lines) {
        const dateMatch = line.match(/^date:\s*(.+)/i);
        const endDateMatch = line.match(/^end_date:\s*(.+)/i);
        const classMatch = line.match(/^class:\s*(\w+)/i);
        
        if (dateMatch) {
          dateStringFromInput = dateMatch[1].trim();
          parsedDateObject = this.parseDate(dateStringFromInput);
          if (parsedDateObject.date) {
            explicitTimeInInput = parsedDateObject.hasTime;
            displayDateString = parsedDateObject.displayString;
          }
        } else if (endDateMatch) {
          endDateStringFromInput = endDateMatch[1].trim();
          parsedEndDateObject = this.parseDate(endDateStringFromInput);
        } else if (classMatch) {
          const foundClass = classMatch[1].toLowerCase();
          if (TimelineApp.Config.VALID_EVENT_CLASSES.includes(foundClass))
            eventClass = `is-${foundClass}`;
        } else {
          contentLines.push(line);
        }
      }

      let eventData = {
        endDate: parsedEndDateObject?.date || null,
        content: contentLines.join("\n").trim(),
        explicitTimeProvided: explicitTimeInInput,
        displayDateString: displayDateString,
        eventClass: eventClass,
        startPos: block.start,
        endPos: block.end
      };

      if (
        parsedDateObject?.date &&
        !isNaN(parsedDateObject.date.getTime())
      ) {
        eventData.date = parsedDateObject.date;
      } else {
        eventData.date = new Date(0); // Invalid date
        const errorMsg = dateStringFromInput
          ? `**Fehler:** Ungültiges Datum: \`${dateStringFromInput}\``
          : `**Fehler:** Kein Datum gefunden.`;
        eventData.content = `${errorMsg}\n\n${eventData.content}`;
      }
      events.push(eventData);
    });

    return events;
  },

  /**
   * Calculate duration between dates
   */
  calculateDuration(startDate, endDate) {
    const diff = endDate - startDate;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days < 1) return "< 1 Tag";
    if (days === 1) return "1 Tag";
    if (days < 7) return `${days} Tage`;
    if (days < 30) {
      const weeks = Math.floor(days / 7);
      return weeks === 1 ? "1 Woche" : `${weeks} Wochen`;
    }
    if (days < 365) {
      const months = Math.floor(days / 30);
      return months === 1 ? "1 Monat" : `${months} Monate`;
    }
    const years = Math.floor(days / 365);
    return years === 1 ? "1 Jahr" : `${years} Jahre`;
  }
};
