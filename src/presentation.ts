/**
 * Presentation Module
 * Handles communication with presentation window
 */

import type { ThemeMode } from './types';

interface PresentationMessage {
  type: 'init' | 'update' | 'theme' | 'filters' | 'ping' | 'pong' | 'request_data' | 'presentation_closed';
  markdown?: string;
  theme?: ThemeMode;
  filters?: string[];
  searchQuery?: string;
  timestamp?: number;
}

export class Presentation {
  private presentationWindow: Window | null = null;
  private channel: BroadcastChannel | null = null;
  private pingInterval: number | null = null;
  private beforeUnloadHandler: (() => void) | null = null;

  /**
   * Open presentation window
   */
  openWindow(): boolean {
    // Calculate window dimensions for FullHD
    const width = 1920;
    const height = 1080;

    // Center on screen if possible
    const left = window.screenX + window.outerWidth / 2 - width / 2;
    const top = window.screenY + window.outerHeight / 2 - height / 2;

    // Window features - minimal chrome
    const features = [
      `width=${width}`,
      `height=${height}`,
      `left=${left}`,
      `top=${top}`,
      'toolbar=no',
      'menubar=no',
      'location=no',
      'status=no',
      'scrollbars=yes',
      'resizable=yes',
    ].join(',');

    // Open window
    this.presentationWindow = window.open('presentation.html', 'TimelinePresentation', features);

    if (!this.presentationWindow) {
      alert(
        'Präsentationsfenster konnte nicht geöffnet werden.\nBitte Popup-Blocker prüfen!'
      );
      return false;
    }

    // Initialize communication
    this.initChannel();

    // Send initial data after window loads
    setTimeout(() => {
      this.sendUpdate();
    }, 500);

    // Monitor window close
    this.monitorWindow();

    // Setup beforeunload handler to close presentation window when main window closes
    this.setupBeforeUnloadHandler();

    return true;
  }

  /**
   * Setup beforeunload handler to close presentation window
   */
  private setupBeforeUnloadHandler(): void {
    // Remove existing handler if any
    if (this.beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler);
    }

    // Create new handler
    this.beforeUnloadHandler = () => {
      if (this.presentationWindow && !this.presentationWindow.closed) {
        this.presentationWindow.close();
      }
    };

    // Add handler
    window.addEventListener('beforeunload', this.beforeUnloadHandler);
  }

  /**
   * Initialize BroadcastChannel
   */
  private initChannel(): void {
    if (this.channel) {
      return; // Already initialized
    }

    try {
      this.channel = new BroadcastChannel('timeline_presentation');

      this.channel.onmessage = (event: MessageEvent<PresentationMessage>) => {
        if (event.data.type === 'request_data') {
          // Presentation window requests data
          this.sendUpdate();
        } else if (event.data.type === 'pong') {
          // Presentation window is alive
        } else if (event.data.type === 'presentation_closed') {
          // Presentation window closed
          this.cleanup();
        }
      };

      // Start ping interval to check connection
      this.pingInterval = window.setInterval(() => {
        if (this.channel && this.presentationWindow && !this.presentationWindow.closed) {
          this.channel.postMessage({ type: 'ping' });
        }
      }, 3000);
    } catch (e) {
      console.error('BroadcastChannel nicht unterstützt:', e);
      alert(
        'Ihr Browser unterstützt keine BroadcastChannel API.\nPräsentationsmodus funktioniert nicht.'
      );
    }
  }

  /**
   * Send update to presentation window
   */
  sendUpdate(
    markdown?: string,
    theme?: ThemeMode,
    filters?: string[],
    searchQuery?: string
  ): void {
    if (!this.channel) return;

    // Get markdown from input if not provided
    if (!markdown) {
      const markdownInput = document.getElementById('markdownInput') as HTMLTextAreaElement;
      markdown = markdownInput ? markdownInput.value : '';
    }

    // Get theme if not provided
    if (!theme) {
      theme = (document.documentElement.getAttribute('data-theme') as ThemeMode) || 'light';
    }

    // Get filters if not provided (requires Search instance)
    if (!filters) {
      // This will be injected by the app
      filters = [];
    }

    // Get search query if not provided
    if (searchQuery === undefined) {
      const searchInput = document.getElementById('searchInput') as HTMLInputElement;
      searchQuery = searchInput ? searchInput.value : '';
    }

    this.channel.postMessage({
      type: 'init',
      markdown: markdown,
      theme: theme,
      filters: filters,
      searchQuery: searchQuery,
      timestamp: Date.now(),
    });
  }

  /**
   * Send only markdown update (when theme unchanged)
   */
  sendMarkdownUpdate(markdown?: string): void {
    if (!this.channel) return;

    if (!markdown) {
      const markdownInput = document.getElementById('markdownInput') as HTMLTextAreaElement;
      markdown = markdownInput ? markdownInput.value : '';
    }

    this.channel.postMessage({
      type: 'update',
      markdown: markdown,
      timestamp: Date.now(),
    });
  }

  /**
   * Send theme update to presentation window
   */
  sendThemeUpdate(theme: ThemeMode): void {
    if (!this.channel) return;

    this.channel.postMessage({
      type: 'theme',
      theme: theme,
      timestamp: Date.now(),
    });
  }

  /**
   * Send filter update to presentation window
   */
  sendFiltersUpdate(filters?: string[], searchQuery?: string): void {
    if (!this.channel) return;

    if (!filters) {
      // This will be injected by the app
      filters = [];
    }

    if (searchQuery === undefined) {
      const searchInput = document.getElementById('searchInput') as HTMLInputElement;
      searchQuery = searchInput ? searchInput.value : '';
    }

    this.channel.postMessage({
      type: 'filters',
      filters: filters,
      searchQuery: searchQuery,
      timestamp: Date.now(),
    });
  }

  /**
   * Monitor presentation window
   */
  private monitorWindow(): void {
    const checkInterval = window.setInterval(() => {
      if (!this.presentationWindow || this.presentationWindow.closed) {
        this.cleanup();
        clearInterval(checkInterval);
      }
    }, 1000);
  }

  /**
   * Check if presentation window is open
   */
  isOpen(): boolean {
    return this.presentationWindow !== null && !this.presentationWindow.closed;
  }

  /**
   * Close presentation window
   */
  closeWindow(): void {
    if (this.presentationWindow && !this.presentationWindow.closed) {
      this.presentationWindow.close();
    }
    this.cleanup();
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }

    if (this.pingInterval !== null) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    // Remove beforeunload handler
    if (this.beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler);
      this.beforeUnloadHandler = null;
    }

    this.presentationWindow = null;
  }

  /**
   * Toggle presentation mode
   */
  toggle(): boolean {
    if (this.isOpen()) {
      this.closeWindow();
      return false;
    } else {
      return this.openWindow();
    }
  }
}
