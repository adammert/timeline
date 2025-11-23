/**
 * Type definitions for Timeline Visualizer
 */

export type EventType = 'critical' | 'warning' | 'success' | 'meeting' | 'work' | 'info';

export type ThemeMode = 'light' | 'dark';

export type ViewMode = 'classic' | 'swimlane';

export interface TimelineEvent {
  date: Date;
  dateString: string;
  type: EventType;
  content: string;
  htmlContent?: string;
  swimlane?: string;
  duration?: number;
  image?: string;
  imageId?: string;
}

export interface ParsedContent {
  title: string;
  body: string;
  events: TimelineEvent[];
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface StatisticsData {
  totalEvents: number;
  eventsByType: Record<EventType, number>;
  eventsByMonth: Record<string, number>;
  eventsByYear: Record<string, number>;
  swimlanes: string[];
  dateRange: DateRange | null;
}

export interface HistoryEntry {
  content: string;
  timestamp: number;
}

export interface StorageData {
  content: string;
  theme: ThemeMode;
  viewMode: ViewMode;
  history: HistoryEntry[];
  historyIndex: number;
}

export interface SearchOptions {
  query: string;
  caseSensitive?: boolean;
  regex?: boolean;
}

export interface FilterOptions {
  types: EventType[];
  swimlanes: string[];
  dateRange?: DateRange;
}

export interface ExportOptions {
  format: 'markdown' | 'html' | 'png' | 'pdf';
  includeTitle?: boolean;
  includeStyles?: boolean;
}

export interface TemplateData {
  name: string;
  description: string;
  content: string;
}

export interface PresentationState {
  isActive: boolean;
  window: Window | null;
  syncEnabled: boolean;
}

export interface ImageData {
  id: string;
  data: string;
  timestamp: number;
  size: number;
}

export interface ParserConfig {
  dateFormats: string[];
  defaultType: EventType;
  allowedTypes: EventType[];
}

export interface RendererConfig {
  animationEnabled: boolean;
  showTimestamps: boolean;
  swimlaneSpacing: number;
  eventSpacing: number;
}

export interface Config {
  parser: ParserConfig;
  renderer: RendererConfig;
  storage: {
    maxHistorySize: number;
    autoSaveDelay: number;
  };
  export: {
    defaultFormat: 'markdown' | 'html' | 'png' | 'pdf';
  };
}
