/**
 * Export Module - PDF, PNG, HTML, Markdown
 */

TimelineApp.Export = {
  /**
   * Sanitize filename
   */
  sanitizeFilename(name, fallback = "timeline") {
    if (!name || typeof name !== "string") return fallback;
    let s = name
      .replace(/[\u0000-\u001f\u007f]+/g, " ")
      .replace(/[<>:"/\\|?*]+/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^\.+|\.+$/g, "")
      .trim();
    if (!s) s = fallback;
    const reserved = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
    if (reserved.test(s)) s = s + "-1";
    if (s.length > 120) s = s.slice(0, 120);
    return s;
  },

  /**
   * Get datetime prefix for filename
   */
  getDateTimePrefix() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const seconds = String(d.getSeconds()).padStart(2, "0");
    return `${y}-${m}-${day}-${hours}${minutes}${seconds}`;
  },

  /**
   * Download file
   */
  downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Export to Markdown
   */
  exportMarkdown(fullMarkdown, timelineOutputContainer, getCurrentTitle) {
    const allEvents = TimelineApp.Renderer.getAllEvents();
    if (!allEvents || allEvents.length === 0) {
      alert("Keine Daten zum Speichern.");
      return;
    }
    
    const visibleEventPositions = new Set();
    timelineOutputContainer.querySelectorAll('.timeline-item:not(.filtered-out)').forEach(item => {
        visibleEventPositions.add(parseInt(item.dataset.startPos, 10));
    });

    if (visibleEventPositions.size === 0) {
      alert("Es gibt keine sichtbaren Timeline-Daten zum Speichern.");
      return;
    }

    const visibleEvents = allEvents
      .filter(event => visibleEventPositions.has(event.startPos))
      .sort((a, b) => a.startPos - b.startPos);

    const markdownChunks = visibleEvents.map(event => {
        return fullMarkdown.substring(event.startPos, event.endPos).trim();
    });

    const title = getCurrentTitle();
    const titleBlock = title ? `# ${title}\n\n` : "";
    const filteredMarkdown = titleBlock + markdownChunks.join('\n\n---\n\n');

    const base = this.sanitizeFilename(title, "timeline-data");
    const prefix = this.getDateTimePrefix();
    this.downloadFile(
      `${prefix}-${base}.md`,
      filteredMarkdown,
      "text/markdown;charset=utf-8"
    );
  },

  /**
   * Export to Markdown with images using File System Access API
   */
  async exportMarkdownWithImages(fullMarkdown, timelineOutputContainer, getCurrentTitle) {
    const allEvents = TimelineApp.Renderer.getAllEvents();
    if (!allEvents || allEvents.length === 0) {
      alert("Keine Daten zum Speichern.");
      return;
    }
    
    const visibleEventPositions = new Set();
    timelineOutputContainer.querySelectorAll('.timeline-item:not(.filtered-out)').forEach(item => {
        visibleEventPositions.add(parseInt(item.dataset.startPos, 10));
    });

    if (visibleEventPositions.size === 0) {
      alert("Es gibt keine sichtbaren Timeline-Daten zum Speichern.");
      return;
    }

    const visibleEvents = allEvents
      .filter(event => visibleEventPositions.has(event.startPos))
      .sort((a, b) => a.startPos - b.startPos);

    const markdownChunks = visibleEvents.map(event => {
        return fullMarkdown.substring(event.startPos, event.endPos).trim();
    });

    const title = getCurrentTitle();
    const titleBlock = title ? `# ${title}\n\n` : "";
    const filteredMarkdown = titleBlock + markdownChunks.join('\n\n---\n\n');
    const markdownContent = filteredMarkdown;

    // Check if File System Access API is supported
    if (!('showDirectoryPicker' in window)) {
      alert('Ihr Browser unterstützt die File System Access API nicht.\n' +
            'Bitte verwenden Sie Chrome oder Edge.\n\n' +
            'Exportiere nur Markdown-Datei ohne Bilder...');
      this.downloadFile(
        `${this.getDateTimePrefix()}-${this.sanitizeFilename(getCurrentTitle(), "timeline-data")}.md`,
        markdownContent,
        "text/markdown;charset=utf-8"
      );
      return;
    }

    try {
      // Get all image names from markdown
      const imageRegex = /!\[([^\]]*)\]\(images\/([^)]+)\)/g;
      const imageNames = new Set();
      let match;
      while ((match = imageRegex.exec(markdownContent)) !== null) {
        imageNames.add(match[2]);
      }

      if (imageNames.size === 0) {
        // No images, just save markdown
        this.downloadFile(
          `${this.getDateTimePrefix()}-${this.sanitizeFilename(getCurrentTitle(), "timeline-data")}.md`,
          markdownContent,
          "text/markdown;charset=utf-8"
        );
        return;
      }

      // Ask user to select directory
      const dirHandle = await window.showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'documents'
      });

      // Create images subdirectory
      const imagesDirHandle = await dirHandle.getDirectoryHandle('images', { create: true });

      // Save all images
      for (const imageName of imageNames) {
        const blob = await TimelineApp.Images.getImage(imageName);
        if (blob) {
          const fileHandle = await imagesDirHandle.getFileHandle(imageName, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
        }
      }

      // Save markdown file
      const base = this.sanitizeFilename(getCurrentTitle(), "timeline-data");
      const prefix = this.getDateTimePrefix();
      const filename = `${prefix}-${base}.md`;
      
      const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(markdownContent);
      await writable.close();

      alert(`Erfolgreich gespeichert:\n- ${filename}\n- ${imageNames.size} Bild(er) im images/ Ordner`);
      
    } catch (e) {
      if (e.name === 'AbortError') {
        // User cancelled
        return;
      }
      console.error('Error saving with images:', e);
      alert('Fehler beim Speichern: ' + e.message);
    }
  },

  /**
   * Load markdown with images using File System Access API
   */
  async loadMarkdownWithImages() {
    if (!('showOpenFilePicker' in window)) {
      alert('Ihr Browser unterstützt die File System Access API nicht.\nBitte verwenden Sie Chrome oder Edge.');
      return null;
    }

    try {
      // Open file picker for .md file
      const [fileHandle] = await window.showOpenFilePicker({
        types: [{
          description: 'Markdown Dateien',
          accept: { 'text/markdown': ['.md'] }
        }],
        multiple: false
      });

      const file = await fileHandle.getFile();
      const markdown = await file.text();

      // Check if markdown contains image references
      const hasImages = /!\[([^\]]*)\]\(images\/([^)]+)\)/.test(markdown);

      if (hasImages) {
        const loadImages = confirm(
          'Diese Markdown-Datei enthält Bilder.\n\n' +
          'Möchten Sie den Ordner mit den Bildern auswählen?\n\n' +
          '(Der Ordner sollte einen "images" Unterordner enthalten)'
        );

        if (loadImages) {
          await this.loadImagesFromDirectory();
        }
      }

      return markdown;

    } catch (e) {
      if (e.name === 'AbortError') {
        return null;
      }
      console.error('Error loading markdown:', e);
      alert('Fehler beim Laden: ' + e.message);
      return null;
    }
  },

  /**
   * Load images from directory
   */
  async loadImagesFromDirectory() {
    try {
      // Ask user to select directory containing images folder
      const dirHandle = await window.showDirectoryPicker({
        mode: 'read',
        startIn: 'documents'
      });

      // Try to find images subdirectory
      let imagesDirHandle;
      try {
        imagesDirHandle = await dirHandle.getDirectoryHandle('images');
      } catch (e) {
        alert('Kein "images" Unterordner gefunden.');
        return 0;
      }

      // Load all images from subdirectory
      let count = 0;
      for await (const entry of imagesDirHandle.values()) {
        if (entry.kind === 'file' && entry.name.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i)) {
          const fileHandle = await imagesDirHandle.getFileHandle(entry.name);
          const file = await fileHandle.getFile();
          await TimelineApp.Images.storeImage(entry.name, file);
          count++;
        }
      }

      if (count > 0) {
        alert(`${count} Bild(er) erfolgreich geladen.`);
      }

      return count;

    } catch (e) {
      if (e.name === 'AbortError') {
        return 0;
      }
      console.error('Error loading images:', e);
      alert('Fehler beim Laden der Bilder: ' + e.message);
      return 0;
    }
  },

  /**
   * Export to HTML
   */
  async exportHtml(timelineOutputContainer, getCurrentTitle) {
    // Clone the container so we don't modify the original
    const clonedContainer = timelineOutputContainer.cloneNode(true);

    // Remove filtered out items from the clone
    clonedContainer.querySelectorAll('.filtered-out').forEach(el => el.remove());

    const timelineHtmlContent = clonedContainer.innerHTML;
    if (
      !timelineHtmlContent.trim() ||
      timelineHtmlContent.includes("info-message") ||
      clonedContainer.children.length === 0
    ) {
      alert(
        "Es gibt keine sichtbaren Timeline-Daten zum Speichern."
      );
      return;
    }

    // Get current theme
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';

    // Find all images with data-filename in the CLONED container
    const images = clonedContainer.querySelectorAll('img[data-filename]');
    
    console.log('Found images for export:', images.length);
    
    for (const img of images) {
      const filename = img.getAttribute('data-filename');
      console.log('Processing image:', filename);
      
      try {
        // Get image directly from IndexedDB
        const blob = await TimelineApp.Images.getImage(filename);
        if (blob) {
          // Convert to base64
          const base64 = await this.blobToBase64(blob);
          img.setAttribute('src', base64);
          // Remove data-filename attribute from export
          img.removeAttribute('data-filename');
          // Make visible
          img.style.display = '';
          console.log('Converted image to base64:', filename);
        } else {
          console.warn('Image not found in IndexedDB:', filename);
          // Fallback: Keep current src if it's already a data URL or valid URL
          const currentSrc = img.getAttribute('src');
          if (currentSrc && !currentSrc.startsWith('data:image/gif')) {
            // Keep it as is (might be external URL or already base64)
            console.log('Keeping existing src:', currentSrc.substring(0, 50));
          } else {
            // Replace with error placeholder
            img.setAttribute('alt', `[Bild nicht gefunden: ${filename}]`);
            img.removeAttribute('src');
          }
          img.removeAttribute('data-filename');
        }
      } catch (e) {
        console.error('Error converting image:', filename, e);
        img.removeAttribute('data-filename');
      }
    }

    // Now get innerHTML from the modified clone
    const processedHtml = clonedContainer.innerHTML;

    const styles = `<style>:root{--primary-color:#007bff;--secondary-color:#6c757d;--background-color:#f8f9fa;--panel-background:#fff;--text-color:#333;--line-color:#dee2e6;--dot-color:var(--primary-color);--font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif}[data-theme="dark"]{--primary-color:#4da6ff;--secondary-color:#a8b2bd;--background-color:#1a1a1a;--panel-background:#2d2d2d;--text-color:#e0e0e0;--line-color:#404040;--dot-color:var(--primary-color)}body{font-family:var(--font-family);margin:20px;background-color:var(--background-color);color:var(--text-color);line-height:1.6;transition:background-color 0.3s ease,color 0.3s ease}.timeline{position:relative;padding:20px 0;max-width:800px;margin:0 auto}.timeline::before{content:'';position:absolute;left:20px;top:0;bottom:0;width:4px;background-color:var(--line-color);border-radius:2px}.timeline-item{position:relative;margin-bottom:30px;padding-left:50px}.timeline-item::before{content:'';position:absolute;left:10px;top:5px;width:24px;height:24px;background-color:var(--dot-color);border:4px solid var(--background-color);border-radius:50%;z-index:1}.timeline-item:last-child{margin-bottom:0}.timeline-content{background-color:var(--panel-background);border:1px solid var(--line-color);padding:15px 20px;border-radius:6px;box-shadow:0 2px 5px rgba(0,0,0,0.05);transition:background-color 0.3s ease}.timeline-content img{max-width:100%;height:auto;border-radius:4px;margin:10px 0}.timeline-date{font-weight:bold;color:var(--primary-color);margin-bottom:8px;font-size:0.9em}.timeline-content h1,.timeline-content h2,.timeline-content h3{margin-top:0;color:var(--primary-color)}.timeline-content p{margin-bottom:0.5em}.timeline-content ul,.timeline-content ol{padding-left:20px}.timeline-content code{background-color:#e9ecef;padding:0.2em 0.4em;border-radius:3px;font-family:Consolas,Monaco,'Andale Mono','Ubuntu Mono',monospace}[data-theme="dark"] .timeline-content code{background-color:#404040}.timeline-content pre{background-color:#e9ecef;padding:1em;border-radius:4px;overflow-x:auto}[data-theme="dark"] .timeline-content pre{background-color:#404040}.is-critical{border-left:5px solid #dc3545}.is-warning{border-left:5px solid #ffc107}.is-success{border-left:5px solid #28a745}.is-meeting{border-left:5px solid #17a2b8}.is-work{border-left:5px solid #6f42c1}.duration-label{display:block;font-size:0.8em;color:var(--secondary-color);margin-top:4px}.duration-bar{position:absolute;left:20px;top:28px;width:4px;background-color:var(--dot-color);opacity:0.5;transform:translateX(-2px)}.duration-end-marker{position:absolute;left:20px;width:16px;height:16px;background-color:var(--dot-color);border-radius:50%;transform:translate(-8px,-4px)}.filtered-out{display:none!important}.no-results-message{text-align:center;padding:20px;color:var(--secondary-color)}.timeline-title{text-align:center;color:var(--primary-color);margin-bottom:30px}body>div.timeline{padding-top:0}</style>`;

    const fullHtml = `<!DOCTYPE html><html lang="de" data-theme="${currentTheme}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Timeline Export</title>${styles}</head><body><div class="timeline">${processedHtml}</div></body></html>`;
    const base = this.sanitizeFilename(getCurrentTitle(), "timeline");
    const prefix = this.getDateTimePrefix();
    this.downloadFile(
      `${prefix}-${base}.html`,
      fullHtml,
      "text/html;charset=utf-8"
    );
  },

  /**
   * Convert blob to base64
   */
  blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  },

  /**
   * Export to PNG
   */
  async exportPng(outputPanel, getCurrentTitle, parseCallback) {
    if (typeof html2canvas === "undefined") {
      alert(
        "html2canvas Bibliothek nicht geladen. PNG-Export nicht möglich."
      );
      return;
    }

    const wasInFullscreen = document.body.classList.contains("fullscreen-mode");
    if (wasInFullscreen) {
      document.body.classList.remove("fullscreen-mode");
    }
    if (parseCallback) await parseCallback();

    const originalTimeline = outputPanel.querySelector(".timeline");
    const savePngBtn = document.getElementById("savePngBtn");

    if (
      !originalTimeline ||
      !originalTimeline.innerHTML.trim() ||
      originalTimeline.innerHTML.includes("info-message")
    ) {
      alert(
        "Es gibt keine Timeline-Daten zum Speichern als PNG oder die Daten sind fehlerhaft."
      );
      if (wasInFullscreen) document.body.classList.add("fullscreen-mode");
      return;
    }

    savePngBtn.textContent = "PNG wird generiert...";
    savePngBtn.disabled = true;

    // --- New logic: clone and filter ---
    const elementToCapture = originalTimeline.cloneNode(true);
    elementToCapture.querySelectorAll('.filtered-out').forEach(el => el.remove());

    // Check if there's anything visible to export
    if (elementToCapture.children.length === 0 || !elementToCapture.textContent.trim()) {
        alert("Es gibt keine sichtbaren Timeline-Daten zum Speichern als PNG.");
        savePngBtn.textContent = "PNG speichern";
        savePngBtn.disabled = false;
        if (wasInFullscreen) document.body.classList.add("fullscreen-mode");
        return;
    }
    
    // Style and append off-screen to ensure styles are computed
    elementToCapture.style.position = 'absolute';
    elementToCapture.style.left = '-9999px';
    elementToCapture.style.top = '0';
    elementToCapture.style.width = `${originalTimeline.offsetWidth}px`; // ensure same width
    document.body.appendChild(elementToCapture);
    // --- End of new logic ---

    const options = {
      scale: window.devicePixelRatio * 1.5,
      useCORS: true,
      logging: false,
      backgroundColor: getComputedStyle(document.documentElement)
        .getPropertyValue("--panel-background")
        .trim()
    };

    try {
      const canvas = await html2canvas(elementToCapture, options);
      const image = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = image;
      const base = this.sanitizeFilename(getCurrentTitle(), "timeline");
      const prefix = this.getDateTimePrefix();
      a.download = `${prefix}-${base}.png`;
      document.body.appendChild(a);
a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error("Fehler beim Erstellen des PNGs:", err);
      alert("Fehler beim Erstellen des PNGs. Siehe Konsole für Details.");
    } finally {
      document.body.removeChild(elementToCapture); // Clean up the clone
      savePngBtn.textContent = "PNG speichern";
      savePngBtn.disabled = false;
      if (wasInFullscreen) document.body.classList.add("fullscreen-mode");
    }
  },

  /**
   * Export to PDF
   */
  async exportPdf(outputPanel, getCurrentTitle, parseCallback) {
    if (typeof jspdf === "undefined") {
      alert("jsPDF Bibliothek nicht geladen. PDF-Export nicht möglich.");
      return;
    }

    const wasInFullscreen = document.body.classList.contains("fullscreen-mode");
    if (wasInFullscreen) {
      document.body.classList.remove("fullscreen-mode");
    }
    if (parseCallback) await parseCallback();

    const savePdfBtn = document.getElementById("savePdfBtn");
    savePdfBtn.textContent = "PDF wird generiert...";
    savePdfBtn.disabled = true;

    try {
      const timelineItems = outputPanel.querySelectorAll(
        ".timeline-item:not(.filtered-out)"
      );

      if (timelineItems.length === 0) {
        alert("Keine sichtbaren Daten für den PDF-Export gefunden.");
        savePdfBtn.textContent = "PDF speichern";
        savePdfBtn.disabled = false;
        if (wasInFullscreen) document.body.classList.add("fullscreen-mode");
        return;
      }

      const { jsPDF } = jspdf;
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - 2 * margin;
      let yPosition = margin;

      const title = getCurrentTitle() || "Timeline";
      pdf.setFontSize(18);
      pdf.setFont(undefined, "bold");
      pdf.text(title, pageWidth / 2, yPosition, { align: "center" });
      yPosition += 15;

      pdf.setFontSize(10);

      for (const item of timelineItems) {
        const dateEl = item.querySelector(".timeline-date");
        const contentEl = item.querySelector(".timeline-content");

        if (!dateEl || !contentEl) continue;

        const date = dateEl.textContent.trim();
        const content = contentEl.innerText.trim();

        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = margin;
        }

        pdf.setFont(undefined, "bold");
        pdf.setTextColor(0, 123, 255);
        pdf.text(date, margin, yPosition);
        yPosition += 6;

        pdf.setFont(undefined, "normal");
        pdf.setTextColor(51, 51, 51);
        const lines = pdf.splitTextToSize(content, contentWidth);

        lines.forEach((line) => {
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = margin;
          }
          pdf.text(line, margin, yPosition);
          yPosition += 5;
        });

        yPosition += 5;
      }

      const base = this.sanitizeFilename(getCurrentTitle(), "timeline");
      const prefix = this.getDateTimePrefix();
      pdf.save(`${prefix}-${base}.pdf`);
    } catch (error) {
      console.error("PDF Export error:", error);
      alert("Fehler beim PDF-Export: " + error.message);
    } finally {
      savePdfBtn.textContent = "PDF speichern";
      savePdfBtn.disabled = false;
      if (wasInFullscreen) document.body.classList.add("fullscreen-mode");
    }
  }
};
