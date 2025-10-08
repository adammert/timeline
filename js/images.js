/**
 * Image Management Module
 * Handles image storage in IndexedDB, drag & drop, paste, and rendering
 */

TimelineApp.Images = {
  db: null,
  DB_NAME: 'TimelineImages',
  DB_VERSION: 1,
  STORE_NAME: 'images',

  /**
   * Initialize IndexedDB
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB error:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME, { keyPath: 'name' });
        }
      };
    });
  },

  /**
   * Store image in IndexedDB
   */
  async storeImage(name, blob) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      
      const request = store.put({
        name: name,
        blob: blob,
        timestamp: Date.now()
      });

      request.onsuccess = () => resolve(name);
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Get image from IndexedDB
   */
  async getImage(name) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(name);

      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result.blob);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Get all image names
   */
  async getAllImageNames() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAllKeys();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Delete image from IndexedDB
   */
  async deleteImage(name) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.delete(name);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Clear all images
   */
  async clearAll() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Handle image file (from drag & drop or paste)
   */
  async handleImageFile(file) {
    if (!file.type.startsWith('image/')) {
      console.warn('Not an image file:', file.type);
      return null;
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || 'png';
    const basename = file.name.split('.').slice(0, -1).join('.') || 'image';
    const sanitized = basename.replace(/[^a-zA-Z0-9-_]/g, '_');
    const filename = `${sanitized}_${timestamp}.${extension}`;

    // Store in IndexedDB
    await this.storeImage(filename, file);

    return filename;
  },

  /**
   * Insert image markdown at cursor position
   */
  insertImageMarkdown(textarea, filename, altText = '') {
    const markdownImage = `![${altText}](images/${filename})`;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    
    // Insert at cursor position
    const before = text.substring(0, start);
    const after = text.substring(end);
    
    // Add newlines if needed
    const needsNewlineBefore = before.length > 0 && !before.endsWith('\n');
    const needsNewlineAfter = after.length > 0 && !after.startsWith('\n');
    
    textarea.value = 
      before + 
      (needsNewlineBefore ? '\n' : '') + 
      markdownImage + 
      (needsNewlineAfter ? '\n' : '') + 
      after;
    
    // Trigger input event
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    
    // Set cursor after inserted image
    const newPosition = start + (needsNewlineBefore ? 1 : 0) + markdownImage.length;
    textarea.setSelectionRange(newPosition, newPosition);
    textarea.focus();
  },

  /**
   * Get image URL from IndexedDB (creates object URL)
   */
  async getImageUrl(name) {
    const blob = await this.getImage(name);
    if (blob) {
      return URL.createObjectURL(blob);
    }
    return null;
  },

  /**
   * Replace image references in HTML with actual images
   */
  async replaceImageReferences(container) {
    // Find images with data-filename (our custom rendered images)
    const images = container.querySelectorAll('img[data-filename]');
    
    for (const img of images) {
      const filename = img.getAttribute('data-filename');
      
      try {
        const url = await this.getImageUrl(filename);
        if (url) {
          img.src = url;
          img.style.maxWidth = '100%';
          img.style.height = 'auto';
          img.style.borderRadius = '4px';
          img.style.marginTop = '10px';
          img.style.marginBottom = '10px';
          img.style.display = 'block'; // Show the image
        } else {
          // Image not found
          img.alt = `[Bild nicht gefunden: ${filename}]`;
          img.style.color = 'red';
          img.style.display = 'block';
        }
      } catch (e) {
        console.error('Error loading image:', filename, e);
      }
    }
  },

  /**
   * Handle paste event (for screenshots)
   */
  async handlePaste(event, textarea) {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        event.preventDefault();
        
        const file = item.getAsFile();
        if (file) {
          const filename = await this.handleImageFile(file);
          if (filename) {
            this.insertImageMarkdown(textarea, filename, 'Screenshot');
          }
        }
        break;
      }
    }
  },

  /**
   * Handle drop event (for drag & drop)
   */
  async handleDrop(event, textarea) {
    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) return false;

    let hasImages = false;
    
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        hasImages = true;
        const filename = await this.handleImageFile(file);
        if (filename) {
          this.insertImageMarkdown(textarea, filename, file.name.split('.')[0]);
        }
      }
    }
    
    return hasImages;
  }
};
