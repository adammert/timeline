/**
 * Image Management Module
 * Enhanced error handling for production environments
 */

interface ImageRecord {
  name: string;
  blob: Blob;
  timestamp: number;
}

export class Images {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'TimelineImages';
  private readonly DB_VERSION = 1;
  private readonly STORE_NAME = 'images';

  /**
   * Initialize IndexedDB with detailed error logging
   */
  async init(): Promise<void> {
    // Check if IndexedDB is available
    if (!window.indexedDB) {
      console.error('IndexedDB nicht verfügbar in diesem Browser');
      alert(
        'Ihr Browser unterstützt keine lokale Bildspeicherung (IndexedDB).\n' +
          'Bilder können nicht gespeichert werden.'
      );
      return Promise.reject(new Error('IndexedDB not available'));
    }

    // Check current origin
    console.log('Current origin:', window.location.origin);
    console.log('Protocol:', window.location.protocol);

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        const error = request.error;
        console.error('IndexedDB initialization error:', error);
        console.error('Error name:', error?.name);
        console.error('Error message:', error?.message);

        if (error?.name === 'SecurityError') {
          alert(
            'IndexedDB Sicherheitsfehler:\n' +
              'Möglicherweise blockieren Browser-Einstellungen oder Cookies den Zugriff.\n' +
              'Bitte überprüfen Sie die Datenschutzeinstellungen.'
          );
        }

        reject(error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB successfully initialized');
        console.log('Database name:', this.db.name);
        console.log('Database version:', this.db.version);
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        console.log('IndexedDB upgrade needed');

        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME, {
            keyPath: 'name',
          });
          console.log('Object store created:', this.STORE_NAME);
        }
      };

      request.onblocked = () => {
        console.warn('IndexedDB blocked - close other tabs using this database');
        alert(
          'Datenbank wird von einem anderen Tab blockiert.\n' +
            'Bitte schließen Sie andere Tabs mit dieser Anwendung.'
        );
      };
    });
  }

  /**
   * Store image with enhanced error handling
   */
  async storeImage(name: string, blob: Blob): Promise<void> {
    if (!this.db) {
      console.error('Database not initialized');
      try {
        await this.init();
      } catch (e) {
        console.error('Failed to initialize database:', e);
        throw new Error('Datenbank konnte nicht initialisiert werden');
      }
    }

    // Validate blob
    if (!(blob instanceof Blob)) {
      console.error('Invalid blob object:', blob);
      throw new Error('Ungültiges Bild-Objekt');
    }

    console.log('Storing image:', name, 'Size:', blob.size, 'Type:', blob.type);

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      try {
        const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');

        transaction.onerror = (event) => {
          console.error('Transaction error:', (event.target as IDBTransaction).error);
          reject((event.target as IDBTransaction).error);
        };

        transaction.oncomplete = () => {
          console.log('Transaction completed successfully');
        };

        const store = transaction.objectStore(this.STORE_NAME);

        const request = store.put({
          name: name,
          blob: blob,
          timestamp: Date.now(),
        });

        request.onsuccess = () => {
          console.log('Image stored successfully:', name);
          resolve();
        };

        request.onerror = (event) => {
          console.error('Store request error:', (event.target as IDBRequest).error);
          reject((event.target as IDBRequest).error);
        };
      } catch (e) {
        console.error('Exception in storeImage:', e);
        reject(e);
      }
    });
  }

  /**
   * Get image with error handling
   */
  async getImage(name: string): Promise<Blob | null> {
    if (!this.db) {
      console.warn('Database not initialized, attempting to initialize...');
      await this.init();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      try {
        const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.get(name);

        request.onsuccess = () => {
          if (request.result) {
            console.log('Image retrieved:', name);
            resolve((request.result as ImageRecord).blob);
          } else {
            console.warn('Image not found:', name);
            resolve(null);
          }
        };

        request.onerror = () => {
          console.error('Error retrieving image:', request.error);
          reject(request.error);
        };
      } catch (e) {
        console.error('Exception in getImage:', e);
        reject(e);
      }
    });
  }

  /**
   * Handle image file with detailed logging
   */
  async handleImageFile(file: File): Promise<string | null> {
    console.log('Processing file:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    });

    if (!file.type.startsWith('image/')) {
      console.warn('Not an image file:', file.type);
      alert(
        `Die Datei "${file.name}" ist kein unterstütztes Bildformat.\n` + `Typ: ${file.type}`
      );
      return null;
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(
        `Das Bild "${file.name}" ist zu groß (${Math.round(file.size / 1024 / 1024)}MB).\n` +
          `Maximum: 10MB`
      );
      return null;
    }

    try {
      // Generate unique filename
      const timestamp = Date.now();
      const extension = file.name.split('.').pop() || 'png';
      const basename = file.name.split('.').slice(0, -1).join('.') || 'image';
      const sanitized = basename.replace(/[^a-zA-Z0-9-_]/g, '_');
      const filename = `${sanitized}_${timestamp}.${extension}`;

      console.log('Generated filename:', filename);

      // Store in IndexedDB
      await this.storeImage(filename, file);

      console.log('Image successfully stored');
      return filename;
    } catch (e) {
      console.error('Error handling image file:', e);
      alert(`Fehler beim Speichern des Bildes:\n${(e as Error).message}`);
      return null;
    }
  }

  /**
   * Handle drop event with detailed logging
   */
  async handleDrop(event: DragEvent, textarea: HTMLTextAreaElement): Promise<boolean> {
    console.log('Drop event triggered');
    console.log('DataTransfer:', event.dataTransfer);

    const files = event.dataTransfer?.files;

    if (!files || files.length === 0) {
      console.warn('No files in drop event');
      return false;
    }

    console.log('Number of files dropped:', files.length);

    let hasImages = false;
    let successCount = 0;
    let errorCount = 0;

    for (const file of Array.from(files)) {
      console.log('Processing dropped file:', file.name);

      if (file.type.startsWith('image/')) {
        hasImages = true;

        try {
          const filename = await this.handleImageFile(file);

          if (filename) {
            this.insertImageMarkdown(textarea, filename, file.name.split('.')[0] || '');
            successCount++;
          } else {
            errorCount++;
          }
        } catch (e) {
          console.error('Error processing image:', e);
          errorCount++;
        }
      }
    }

    if (hasImages) {
      const message = `${successCount} Bild(er) eingefügt`;
      console.log(message);

      if (errorCount > 0) {
        alert(`${message}\n${errorCount} Bild(er) konnten nicht verarbeitet werden.`);
      }
    }

    return hasImages;
  }

  /**
   * Handle paste with detailed logging
   */
  async handlePaste(event: ClipboardEvent, textarea: HTMLTextAreaElement): Promise<void> {
    console.log('Paste event triggered');

    const items = event.clipboardData?.items;

    if (!items) {
      console.warn('No clipboard items');
      return;
    }

    console.log('Number of clipboard items:', items.length);

    for (const item of Array.from(items)) {
      console.log('Clipboard item:', item.type, item.kind);

      if (item.type.startsWith('image/')) {
        event.preventDefault();

        try {
          const file = item.getAsFile();

          if (file) {
            console.log('Got image from clipboard');
            const filename = await this.handleImageFile(file);

            if (filename) {
              this.insertImageMarkdown(textarea, filename, 'Screenshot');
              console.log('Screenshot inserted successfully');
            }
          } else {
            console.error('Failed to get file from clipboard item');
          }
        } catch (e) {
          console.error('Error processing pasted image:', e);
          alert(`Fehler beim Einfügen des Bildes:\n${(e as Error).message}`);
        }

        break;
      }
    }
  }

  /**
   * Insert image markdown at cursor
   */
  insertImageMarkdown(textarea: HTMLTextAreaElement, filename: string, altText = ''): void {
    const markdownImage = `![${altText}](images/${filename})`;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const before = text.substring(0, start);
    const after = text.substring(end);

    const needsNewlineBefore = before.length > 0 && !before.endsWith('\n');
    const needsNewlineAfter = after.length > 0 && !after.startsWith('\n');

    textarea.value =
      before +
      (needsNewlineBefore ? '\n' : '') +
      markdownImage +
      (needsNewlineAfter ? '\n' : '') +
      after;

    textarea.dispatchEvent(new Event('input', { bubbles: true }));

    const newPosition = start + (needsNewlineBefore ? 1 : 0) + markdownImage.length;
    textarea.setSelectionRange(newPosition, newPosition);
    textarea.focus();

    console.log('Markdown inserted at position:', newPosition);
  }

  /**
   * Get image URL from IndexedDB
   */
  async getImageUrl(name: string): Promise<string | null> {
    try {
      const blob = await this.getImage(name);
      if (blob) {
        const url = URL.createObjectURL(blob);
        console.log('Created object URL for:', name);
        return url;
      }
      return null;
    } catch (e) {
      console.error('Error creating image URL:', e);
      return null;
    }
  }

  /**
   * Replace image references in HTML
   */
  async replaceImageReferences(container: HTMLElement): Promise<void> {
    const images = container.querySelectorAll('img[data-filename]');
    console.log('Replacing', images.length, 'image references');

    for (const img of Array.from(images)) {
      const filename = img.getAttribute('data-filename');
      if (!filename) continue;

      try {
        const url = await this.getImageUrl(filename);
        if (url) {
          (img as HTMLImageElement).src = url;
          (img as HTMLImageElement).style.maxWidth = '100%';
          (img as HTMLImageElement).style.height = 'auto';
          (img as HTMLImageElement).style.borderRadius = '4px';
          (img as HTMLImageElement).style.marginTop = '10px';
          (img as HTMLImageElement).style.marginBottom = '10px';
          (img as HTMLImageElement).style.display = 'block';
          console.log('Image loaded:', filename);
        } else {
          (img as HTMLImageElement).alt = `[Bild nicht gefunden: ${filename}]`;
          (img as HTMLImageElement).style.color = 'red';
          (img as HTMLImageElement).style.display = 'block';
          console.error('Image not found in database:', filename);
        }
      } catch (e) {
        console.error('Error loading image:', filename, e);
        (img as HTMLImageElement).alt = `[Fehler beim Laden: ${filename}]`;
        (img as HTMLImageElement).style.color = 'red';
        (img as HTMLImageElement).style.display = 'block';
      }
    }
  }

  /**
   * Get all image names
   */
  async getAllImageNames(): Promise<string[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAllKeys();

      request.onsuccess = () => resolve(request.result as string[]);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete image from IndexedDB
   */
  async deleteImage(name: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.delete(name);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all images
   */
  async clearAll(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}
