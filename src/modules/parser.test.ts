import { describe, it, expect } from 'vitest';
import { Parser } from './parser';

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
});
