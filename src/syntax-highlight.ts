/**
 * Syntax Highlighting Module for Timeline Editor
 * Provides real-time syntax highlighting for timeline markdown
 */

// Token types for highlighting
type TokenType = 'keyword' | 'string' | 'date' | 'header' | 'separator' | 'comment' | 'class-value';

// CSS classes for each token type
const TOKEN_CLASSES: Record<TokenType, string> = {
  keyword: 'token-keyword',
  string: 'token-string',
  date: 'token-date',
  header: 'token-header',
  separator: 'token-separator',
  comment: 'token-comment',
  'class-value': 'token-class-value',
};

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
}

/**
 * Apply syntax highlighting to text
 */
export function highlightSyntax(text: string): string {
  if (!text) return '';

  // First escape HTML
  let result = escapeHtml(text);

  // Process line by line for better control
  const lines = result.split('\n');
  const highlightedLines = lines.map(line => highlightLine(line));

  return highlightedLines.join('\n');
}

/**
 * Highlight a single line
 */
function highlightLine(line: string): string {
  // Check for separator
  if (/^---$/.test(line)) {
    return `<span class="${TOKEN_CLASSES.separator}">${line}</span>`;
  }

  // Check for headers
  if (/^#{1,6}\s+/.test(line)) {
    return `<span class="${TOKEN_CLASSES.header}">${line}</span>`;
  }

  // Check for keyword lines (date:, class:, etc.)
  const keywordMatch = line.match(/^(date:|end_date:|class:|title:|group:)(\s*)(.*)$/);
  if (keywordMatch) {
    const keyword = keywordMatch[1] || '';
    const space = keywordMatch[2] || '';
    const value = keywordMatch[3] || '';
    const highlightedValue = highlightValue(keyword, value);
    return `<span class="${TOKEN_CLASSES.keyword}">${keyword}</span>${space}${highlightedValue}`;
  }

  // Default: return line with date highlighting
  return highlightDates(line);
}

/**
 * Highlight the value part based on keyword type
 */
function highlightValue(keyword: string, value: string): string {
  if (keyword === 'class:') {
    // Highlight class values with specific colors
    const classMatch = value.match(/^(critical|warning|success|meeting|work)(.*)$/);
    if (classMatch) {
      const classValue = classMatch[1] || '';
      const rest = classMatch[2] || '';
      return `<span class="${TOKEN_CLASSES['class-value']} class-${classValue}">${classValue}</span>${rest}`;
    }
    return value;
  }

  if (keyword === 'date:' || keyword === 'end_date:') {
    // Highlight date values
    return highlightDates(value);
  }

  if (keyword === 'title:') {
    return `<span class="${TOKEN_CLASSES.string}">${value}</span>`;
  }

  return value;
}

/**
 * Highlight date patterns in text
 */
function highlightDates(text: string): string {
  // ISO dates (2025-01-15, 2025-01-15 14:30:00)
  let result = text.replace(
    /\b(\d{4}-\d{2}-\d{2}(?:\s+\d{2}:\d{2}(?::\d{2})?)?)\b/g,
    `<span class="${TOKEN_CLASSES.date}">$1</span>`
  );

  // German dates (15.01.2025)
  result = result.replace(
    /\b(\d{2}\.\d{2}\.\d{4}(?:\s+\d{2}:\d{2})?)\b/g,
    `<span class="${TOKEN_CLASSES.date}">$1</span>`
  );

  // Quarter dates (Q1 2025, 2025 Q1)
  result = result.replace(
    /\b(Q[1-4]\s+\d{4}|\d{4}\s+Q[1-4])\b/g,
    `<span class="${TOKEN_CLASSES.date}">$1</span>`
  );

  // German month names
  result = result.replace(
    /\b(Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)\s+(\d{4})\b/g,
    `<span class="${TOKEN_CLASSES.date}">$1 $2</span>`
  );

  return result;
}

/**
 * SyntaxHighlighter class for managing editor highlighting
 */
export class SyntaxHighlighter {
  private textarea: HTMLTextAreaElement;
  private overlay: HTMLPreElement;
  private content: HTMLElement;
  private debounceTimer: number | null = null;

  constructor(textareaId: string, overlayId: string, contentId: string) {
    this.textarea = document.getElementById(textareaId) as HTMLTextAreaElement;
    this.overlay = document.getElementById(overlayId) as HTMLPreElement;
    this.content = document.getElementById(contentId) as HTMLElement;

    if (!this.textarea || !this.overlay || !this.content) {
      console.warn('SyntaxHighlighter: Could not find required elements');
      return;
    }

    this.init();
  }

  private init(): void {
    // Initial highlight
    this.updateHighlight();

    // Listen for input changes
    this.textarea.addEventListener('input', () => this.scheduleUpdate());

    // Sync scroll position
    this.textarea.addEventListener('scroll', () => this.syncScroll());

    // Handle resize
    const resizeObserver = new ResizeObserver(() => this.syncScroll());
    resizeObserver.observe(this.textarea);
  }

  private scheduleUpdate(): void {
    if (this.debounceTimer !== null) {
      cancelAnimationFrame(this.debounceTimer);
    }
    this.debounceTimer = requestAnimationFrame(() => {
      this.updateHighlight();
      this.debounceTimer = null;
    });
  }

  private updateHighlight(): void {
    const text = this.textarea.value;
    const highlighted = highlightSyntax(text);

    // Add a trailing newline to match textarea behavior
    this.content.innerHTML = highlighted + '\n';
  }

  private syncScroll(): void {
    this.overlay.scrollTop = this.textarea.scrollTop;
    this.overlay.scrollLeft = this.textarea.scrollLeft;
  }

  /**
   * Force update (call after programmatic changes to textarea)
   */
  public refresh(): void {
    this.updateHighlight();
    this.syncScroll();
  }
}
