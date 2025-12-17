/**
 * Date and Event Parsing Module
 */

import { MONTH_NAME_TO_INDEX, VALID_EVENT_CLASSES } from './config';
import type { EventType } from './types';

interface ParsedDate {
  date: Date | null;
  displayString: string | null;
  hasTime: boolean;
}

interface TitleExtraction {
  title: string | null;
  body: string;
}

interface EventBlock {
  text: string;
  start: number;
  end: number;
}

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

export class Parser {
  /**
   * Extract title from markdown
   */
  static extractTitleFromMarkdown(text: string): TitleExtraction {
    if (!text) return { title: null, body: '' };
    const lines = String(text).replace(/\r\n/g, '\n').split('\n');
    let title: string | null = null;
    let consumedIndex = -1;

    let i = 0;
    while (i < lines.length && lines[i]?.trim() === '') i++;

    if (i < lines.length) {
      const line = lines[i];
      if (line) {
        let m = line.match(/^\s*title:\s*(.+)\s*$/i);
        if (m && m[1]?.trim()) {
          title = m[1].trim();
          consumedIndex = i;
        } else {
          m = line.match(/^\s*#{1,6}\s+(.+)\s*$/);
          if (m && m[1]?.trim()) {
            title = m[1].trim();
            consumedIndex = i;
          }
        }
      }
    }

    let body: string;
    if (consumedIndex >= 0) {
      const remaining = lines
        .slice(0, consumedIndex)
        .concat(lines.slice(consumedIndex + 1));
      body = remaining.join('\n');
    } else {
      body = lines.join('\n');
    }
    return { title, body };
  }

  /**
   * Parse date string with multiple format support
   */
  static parseDate(dateString: string): ParsedDate {
    let parsedDateObject: Date | null = null;
    let displayDateString: string | null = null;
    let hasTime = false;

    // Check for Quarter format (Q1 2025 or 2025 Q1)
    let quarterMatch = dateString.match(/^(Q([1-4]))\s*(\d{4})$/i);
    if (!quarterMatch) {
      const altMatch = dateString.match(/^(\d{4})\s*(Q([1-4]))$/i);
      if (altMatch) {
        quarterMatch = [altMatch[0], altMatch[2], altMatch[3], altMatch[1]] as RegExpMatchArray;
      }
    }
    if (quarterMatch) {
      const quarterStr = quarterMatch[2];
      const yearStr = quarterMatch[3];
      if (!quarterStr || !yearStr) {
        return { date: null, displayString: null, hasTime: false };
      }
      const quarter = parseInt(quarterStr, 10);
      const year = parseInt(yearStr, 10);
      if (isNaN(quarter) || isNaN(year) || quarter < 1 || quarter > 4) {
        return { date: null, displayString: null, hasTime: false };
      }
      parsedDateObject = new Date(year, (quarter - 1) * 3, 1);
      displayDateString = `Q${quarter} ${year}`;
      return {
        date: parsedDateObject,
        displayString: displayDateString,
        hasTime: false,
      };
    }

    // Check for month name format (Januar 2025 or 2025 Januar)
    let monthNameMatch = dateString.match(/^([a-zA-ZäöüÄÖÜß]+)\s*(\d{4})$/i);
    if (!monthNameMatch) {
      const altMatch = dateString.match(/^(\d{4})\s*([a-zA-ZäöüÄÖÜß]+)$/i);
      if (altMatch) {
        monthNameMatch = [altMatch[0], altMatch[2], altMatch[1]] as RegExpMatchArray;
      }
    }
    if (monthNameMatch) {
      const monthNameStr = monthNameMatch[1];
      const yearStr = monthNameMatch[2];
      if (!monthNameStr || !yearStr) {
        return { date: null, displayString: null, hasTime: false };
      }
      const monthName = monthNameStr.toLowerCase();
      const year = parseInt(yearStr, 10);
      if (isNaN(year)) {
        return { date: null, displayString: null, hasTime: false };
      }
      if (Object.prototype.hasOwnProperty.call(MONTH_NAME_TO_INDEX, monthName)) {
        const monthIndex = MONTH_NAME_TO_INDEX[monthName];
        if (monthIndex === undefined) {
          return { date: null, displayString: null, hasTime: false };
        }
        parsedDateObject = new Date(year, monthIndex, 1);
        displayDateString = `${monthNameStr.charAt(0).toUpperCase() + monthNameStr.slice(1)} ${year}`;
        return {
          date: parsedDateObject,
          displayString: displayDateString,
          hasTime: false,
        };
      }
    }

    // Try standard Date constructor
    try {
      parsedDateObject = new Date(dateString);
      if (isNaN(parsedDateObject.getTime())) {
        throw new Error('Invalid date format.');
      }
      hasTime = dateString.includes(':');
      return {
        date: parsedDateObject,
        displayString: null,
        hasTime: hasTime,
      };
    } catch (e) {
      // Try German date format (DD.MM.YYYY)
      const germanDateMatch = dateString.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
      if (germanDateMatch) {
        const day = parseInt(germanDateMatch[1] || '1', 10);
        const month = parseInt(germanDateMatch[2] || '1', 10) - 1;
        const year = parseInt(germanDateMatch[3] || '2025', 10);
        const timeParts: [number, number, number] = [0, 0, 0];
        const timeMatch = dateString.match(/(\d{1,2}):(\d{1,2})(:(\d{1,2}))?/);
        if (timeMatch) {
          timeParts[0] = parseInt(timeMatch[1] || '0', 10);
          timeParts[1] = parseInt(timeMatch[2] || '0', 10);
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
            hasTime: hasTime,
          };
        }
      }

      console.warn(`Date parsing failed for: "${dateString}"`);
      return { date: null, displayString: null, hasTime: false };
    }
  }

  /**
   * Parse markdown into events
   */
  static parseEvents(bodyText: string, bodyOffset: number): RawEventData[] {
    const eventBlocks: EventBlock[] = [];
    const separatorRegex = /(\r\n---\r\n|\n---\n|\r---\r)/g;
    let lastIndex = 0;
    let match;

    while ((match = separatorRegex.exec(bodyText)) !== null) {
      const eventStr = bodyText.substring(lastIndex, match.index);
      if (eventStr.trim()) {
        eventBlocks.push({
          text: eventStr,
          start: bodyOffset + lastIndex,
          end: bodyOffset + match.index,
        });
      }
      lastIndex = separatorRegex.lastIndex;
    }

    const lastEventStr = bodyText.substring(lastIndex);
    if (lastEventStr.trim()) {
      eventBlocks.push({
        text: lastEventStr,
        start: bodyOffset + lastIndex,
        end: bodyOffset + bodyText.length,
      });
    }

    const events: RawEventData[] = [];
    eventBlocks.forEach((block) => {
      const eventStr = block.text;
      const lines = eventStr.trim().split('\n');
      let dateStringFromInput: string | null = null;
      let endDateStringFromInput: string | null = null;
      let explicitTimeInInput = false;
      let displayDateString: string | null = null;
      let parsedDateObject: ParsedDate | null = null;
      let parsedEndDateObject: ParsedDate | null = null;
      let eventClass: string | null = null;
      let eventGroup = 'Default';
      const contentLines: string[] = [];

      for (const line of lines) {
        const dateMatch = line.match(/^date:\s*(.+)/i);
        const endDateMatch = line.match(/^end_date:\s*(.+)/i);
        const classMatch = line.match(/^class:\s*(\w+)/i);
        const groupMatch = line.match(/^(group|lane):\s*(.+)/i);

        if (dateMatch) {
          dateStringFromInput = dateMatch[1]?.trim() || null;
          if (dateStringFromInput) {
            parsedDateObject = this.parseDate(dateStringFromInput);
            if (parsedDateObject.date) {
              explicitTimeInInput = parsedDateObject.hasTime;
              displayDateString = parsedDateObject.displayString;
            }
          }
        } else if (endDateMatch) {
          endDateStringFromInput = endDateMatch[1]?.trim() || null;
          if (endDateStringFromInput) {
            parsedEndDateObject = this.parseDate(endDateStringFromInput);
          }
        } else if (classMatch) {
          const foundClass = classMatch[1]?.toLowerCase();
          if (foundClass && VALID_EVENT_CLASSES.includes(foundClass as EventType)) {
            eventClass = `is-${foundClass}`;
          }
        } else if (groupMatch) {
          eventGroup = groupMatch[2]?.trim() || 'Default';
        } else {
          contentLines.push(line);
        }
      }

      const eventData: RawEventData = {
        date: new Date(0),
        endDate: parsedEndDateObject?.date || null,
        content: contentLines.join('\n').trim(),
        explicitTimeProvided: explicitTimeInInput,
        displayDateString: displayDateString,
        eventClass: eventClass,
        group: eventGroup,
        startPos: block.start,
        endPos: block.end,
      };

      if (parsedDateObject?.date && !isNaN(parsedDateObject.date.getTime())) {
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
  }

  /**
   * Calculate duration between dates
   */
  static calculateDuration(startDate: Date, endDate: Date): string {
    const diff = endDate.getTime() - startDate.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days < 1) return '< 1 Tag';
    if (days === 1) return '1 Tag';
    if (days < 7) return `${days} Tage`;
    if (days < 30) {
      const weeks = Math.floor(days / 7);
      return weeks === 1 ? '1 Woche' : `${weeks} Wochen`;
    }
    if (days < 365) {
      const months = Math.floor(days / 30);
      return months === 1 ? '1 Monat' : `${months} Monate`;
    }
    const years = Math.floor(days / 365);
    return years === 1 ? '1 Jahr' : `${years} Jahre`;
  }
}
