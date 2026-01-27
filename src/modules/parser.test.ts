import { describe, it, expect } from 'vitest';
import { Parser } from '../parser';

describe('Parser', () => {
  describe('extractTitleFromMarkdown', () => {
    it('should extract title from "title:" prefix', () => {
      const text = 'title: My Timeline\nSome content';
      const result = Parser.extractTitleFromMarkdown(text);
      expect(result.title).toBe('My Timeline');
      expect(result.body).toBe('Some content');
    });

    it('should extract title from H1 header', () => {
      const text = '# My Project\nMore info';
      const result = Parser.extractTitleFromMarkdown(text);
      expect(result.title).toBe('My Project');
      expect(result.body).toBe('More info');
    });

    it('should return null title and empty body for empty text', () => {
      const result = Parser.extractTitleFromMarkdown('');
      expect(result.title).toBe(null);
      expect(result.body).toBe('');
    });

    it('should handle text without a title', () => {
      const text = 'Just some text\nwithout a title';
      const result = Parser.extractTitleFromMarkdown(text);
      expect(result.title).toBe(null);
      expect(result.body).toBe('Just some text\nwithout a title');
    });
  });

  describe('parseDate', () => {
    it('should parse ISO date format', () => {
      const result = Parser.parseDate('2025-01-01');
      expect(result.date?.getFullYear()).toBe(2025);
      expect(result.date?.getMonth()).toBe(0);
      expect(result.date?.getDate()).toBe(1);
      expect(result.hasTime).toBe(false);
    });

    it('should parse ISO date with time', () => {
      const result = Parser.parseDate('2025-01-01 12:30:00');
      expect(result.date?.getHours()).toBe(12);
      expect(result.date?.getMinutes()).toBe(30);
      expect(result.hasTime).toBe(true);
    });

    it('should parse German date format (DD.MM.YYYY)', () => {
      const result = Parser.parseDate('31.12.2025');
      expect(result.date?.getFullYear()).toBe(2025);
      expect(result.date?.getMonth()).toBe(11);
      expect(result.date?.getDate()).toBe(31);
    });

    it('should parse Quarter format (Q1 2025)', () => {
      const result = Parser.parseDate('Q1 2025');
      expect(result.date?.getFullYear()).toBe(2025);
      expect(result.date?.getMonth()).toBe(0); // Jan
      expect(result.displayString).toBe('Q1 2025');
    });

    it('should parse Quarter format (2025 Q3)', () => {
      const result = Parser.parseDate('2025 Q3');
      expect(result.date?.getFullYear()).toBe(2025);
      expect(result.date?.getMonth()).toBe(6); // Jul
      expect(result.displayString).toBe('Q3 2025');
    });

    it('should parse German month names (Januar 2025)', () => {
      const result = Parser.parseDate('Januar 2025');
      expect(result.date?.getFullYear()).toBe(2025);
      expect(result.date?.getMonth()).toBe(0);
      expect(result.displayString).toBe('Januar 2025');
    });

    it('should parse German month names reversed (2025 März)', () => {
      const result = Parser.parseDate('2025 März');
      expect(result.date?.getFullYear()).toBe(2025);
      expect(result.date?.getMonth()).toBe(2);
      expect(result.displayString).toBe('März 2025');
    });

    it('should return null for invalid date', () => {
      const result = Parser.parseDate('invalid-date');
      expect(result.date).toBe(null);
    });
  });

  describe('parseEvents', () => {
    it('should parse a single simple event', () => {
      const text = 'date: 2025-01-01\nEvent content';
      const result = Parser.parseEvents(text, 0);
      expect(result.length).toBe(1);
      expect(result[0].date.getFullYear()).toBe(2025);
      expect(result[0].content).toBe('Event content');
    });

    it('should parse multiple events separated by ---', () => {
      const text = 'date: 2025-01-01\nEvent 1\n---\ndate: 2025-01-02\nEvent 2';
      const result = Parser.parseEvents(text, 0);
      expect(result.length).toBe(2);
      expect(result[0].content).toBe('Event 1');
      expect(result[1].content).toBe('Event 2');
    });

    it('should handle metadata like group and class', () => {
      const text = 'date: 2025-01-01\ngroup: Work\nclass: critical\nImportant event';
      const result = Parser.parseEvents(text, 0);
      expect(result[0].group).toBe('Work');
      expect(result[0].eventClass).toBe('is-critical');
      expect(result[0].content).toBe('Important event');
    });

    it('should handle events with end_date', () => {
      const text = 'date: 2025-01-01\nend_date: 2025-01-05\nLong event';
      const result = Parser.parseEvents(text, 0);
      expect(result[0].endDate?.getFullYear()).toBe(2025);
      expect(result[0].endDate?.getDate()).toBe(5);
    });

    it('should provide error message for missing date', () => {
      const text = 'Just content without date';
      const result = Parser.parseEvents(text, 0);
      expect(result[0].content).toContain('Fehler');
      expect(result[0].date.getTime()).toBe(0);
    });
  });

  describe('calculateDuration', () => {
    it('should calculate days correctly', () => {
      const start = new Date(2025, 0, 1);
      const end = new Date(2025, 0, 5);
      expect(Parser.calculateDuration(start, end)).toBe('4 Tage');
    });

    it('should calculate weeks correctly', () => {
      const start = new Date(2025, 0, 1);
      const end = new Date(2025, 0, 15);
      expect(Parser.calculateDuration(start, end)).toBe('2 Wochen');
    });
  });
});
