/**
 * Presentation Module
 * Handles communication with presentation window
 */

TimelineApp.Presentation = {
  // State
  presentationWindow: null,
  channel: null,
  isConnected: false,
  pingInterval: null,

  /**
   * Open presentation window
   */
  openWindow() {
    // Calculate window dimensions for FullHD
    const width = 1920;
    const height = 1080;
    
    // Center on screen if possible
    const left = window.screenX + (window.outerWidth / 2) - (width / 2);
    const top = window.screenY + (window.outerHeight / 2) - (height / 2);
    
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
      'resizable=yes'
    ].join(',');
    
    // Open window
    this.presentationWindow = window.open(
      'presentation.html',
      'TimelinePresentation',
      features
    );
    
    if (!this.presentationWindow) {
      alert('Präsentationsfenster konnte nicht geöffnet werden.\nBitte Popup-Blocker prüfen!');
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
    
    return true;
  },

  /**
   * Initialize BroadcastChannel
   */
  initChannel() {
    if (this.channel) {
      return; // Already initialized
    }
    
    try {
      this.channel = new BroadcastChannel('timeline_presentation');
      
      this.channel.onmessage = (event) => {
        if (event.data.type === 'request_data') {
          // Presentation window requests data
          this.sendUpdate();
        } else if (event.data.type === 'pong') {
          // Presentation window is alive
          this.isConnected = true;
        } else if (event.data.type === 'presentation_closed') {
          // Presentation window closed
          this.cleanup();
        }
      };
      
      // Start ping interval to check connection
      this.pingInterval = setInterval(() => {
        if (this.channel && this.presentationWindow && !this.presentationWindow.closed) {
          this.channel.postMessage({ type: 'ping' });
        }
      }, 3000);
      
    } catch (e) {
      console.error('BroadcastChannel nicht unterstützt:', e);
      alert('Ihr Browser unterstützt keine BroadcastChannel API.\nPräsentationsmodus funktioniert nicht.');
    }
  },

  /**
   * Send update to presentation window
   */
  sendUpdate(markdown, theme, filters, searchQuery) {
    if (!this.channel) return;
    
    // Get markdown from input if not provided
    if (!markdown) {
      const markdownInput = document.getElementById('markdownInput');
      markdown = markdownInput ? markdownInput.value : '';
    }
    
    // Get theme if not provided
    if (!theme) {
      theme = document.documentElement.getAttribute('data-theme') || 'light';
    }
    
    // Get filters if not provided
    if (!filters) {
      filters = Array.from(TimelineApp.Search.getActiveFilters());
    }
    
    // Get search query if not provided
    if (searchQuery === undefined) {
      const searchInput = document.getElementById('searchInput');
      searchQuery = searchInput ? searchInput.value : '';
    }
    
    this.channel.postMessage({
      type: 'init',
      markdown: markdown,
      theme: theme,
      filters: filters,
      searchQuery: searchQuery,
      timestamp: Date.now()
    });
  },

  /**
   * Send only markdown update (when theme unchanged)
   */
  sendMarkdownUpdate(markdown) {
    if (!this.channel) return;
    
    if (!markdown) {
      const markdownInput = document.getElementById('markdownInput');
      markdown = markdownInput ? markdownInput.value : '';
    }
    
    this.channel.postMessage({
      type: 'update',
      markdown: markdown,
      timestamp: Date.now()
    });
  },

  /**
   * Send theme update to presentation window
   */
  sendThemeUpdate(theme) {
    if (!this.channel) return;
    
    this.channel.postMessage({
      type: 'theme',
      theme: theme,
      timestamp: Date.now()
    });
  },

  /**
   * Send filter update to presentation window
   */
  sendFiltersUpdate(filters, searchQuery) {
    if (!this.channel) return;
    
    if (!filters) {
      filters = Array.from(TimelineApp.Search.getActiveFilters());
    }
    
    if (searchQuery === undefined) {
      const searchInput = document.getElementById('searchInput');
      searchQuery = searchInput ? searchInput.value : '';
    }
    
    this.channel.postMessage({
      type: 'filters',
      filters: filters,
      searchQuery: searchQuery,
      timestamp: Date.now()
    });
  },

  /**
   * Monitor presentation window
   */
  monitorWindow() {
    const checkInterval = setInterval(() => {
      if (!this.presentationWindow || this.presentationWindow.closed) {
        this.cleanup();
        clearInterval(checkInterval);
      }
    }, 1000);
  },

  /**
   * Check if presentation window is open
   */
  isOpen() {
    return this.presentationWindow && !this.presentationWindow.closed;
  },

  /**
   * Close presentation window
   */
  closeWindow() {
    if (this.presentationWindow && !this.presentationWindow.closed) {
      this.presentationWindow.close();
    }
    this.cleanup();
  },

  /**
   * Cleanup resources
   */
  cleanup() {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    this.presentationWindow = null;
    this.isConnected = false;
  },

  /**
   * Toggle presentation mode
   */
  toggle() {
    if (this.isOpen()) {
      this.closeWindow();
      return false;
    } else {
      return this.openWindow();
    }
  }
};
