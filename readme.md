# Timeline Visualizer

Eine standalone HTML-Anwendung zur Visualisierung von Ereignissen als interaktive Timeline. Keine Installation, kein Webserver, kein Build-Prozess nötig.

## Inhaltsverzeichnis

- [Überblick](#überblick)
- [Installation](#installation)
- [Architektur](#architektur)
- [Module im Detail](#module-im-detail)
- [Features hinzufügen](#features-hinzufügen)
- [Code-Konventionen](#code-konventionen)
- [Markdown-Format](#markdown-format)
- [Technische Details](#technische-details)

---

## Überblick

**Timeline Visualizer** ermöglicht es, Ereignisse in Markdown-Format einzugeben und als visuell ansprechende Timeline darzustellen.

### Hauptfeatures

- **Markdown-basierte Eingabe** mit einfacher Syntax
- **Flexible Datumsformate**: ISO, Deutsch (DD.MM.YYYY), Quartale (Q1 2025), Monatsnamen
- **Kategorisierung**: critical, warning, success, meeting, work
- **Dauer-Events**: Events mit Start- und Enddatum
- **Export**: Markdown, HTML, PNG, PDF
- **Live-Suche** mit Highlighting
- **Filter** nach Kategorien
- **Statistiken** über Events
- **Templates** für schnellen Start
- **Auto-Save** mit LocalStorage
- **Undo/Redo** (Strg+Z/Y)
- **Dark/Light Theme**

### Technologie-Stack

- **Vanilla JavaScript** (ES6+) - kein Framework
- **Marked.js** - Markdown-zu-HTML Konvertierung
- **html2canvas** - PNG-Export
- **jsPDF** - PDF-Export
- Keine Build-Tools, läuft direkt im Browser

---

## Installation

1. Verzeichnisstruktur erstellen:
   ```
   timeline-visualizer/
   ├── index.html
   ├── css/
   │   └── styles.css
   └── js/
       ├── config.js
       ├── storage.js
       ├── parser.js
       ├── renderer.js
       ├── search.js
       ├── stats.js
       ├── export.js
       └── app.js
   ```

2. Dateien in entsprechende Ordner kopieren

3. `index.html` im Browser öffnen - fertig!

**Wichtig:** Die Anwendung läuft komplett lokal. Alle Daten werden nur im Browser gespeichert (LocalStorage).

---

## Architektur

### Design-Prinzipien

1. **Modularität**: Jedes Modul hat eine klar definierte Verantwortung
2. **Namespace**: Alle Module leben unter `TimelineApp.*` um globale Konflikte zu vermeiden
3. **Lose Kopplung**: Module kommunizieren über definierte Schnittstellen
4. **Keine Abhängigkeiten**: Jedes Modul ist unabhängig testbar

### Modul-Hierarchie

```
TimelineApp (Global Namespace)
├── Config        - Konstanten, Templates, Konfiguration
├── Storage       - LocalStorage, History, Theme-Verwaltung
├── Parser        - Datums-Parsing, Event-Parsing, Text-Extraktion
├── Renderer      - Timeline-Rendering, DOM-Manipulation
├── Search        - Such- und Filter-Logik
├── Stats         - Statistik-Berechnung und -Darstellung
└── Export        - Export-Funktionen (PDF, PNG, HTML, MD)

App.js koordiniert alle Module und behandelt User-Interaktionen
```

### Datenfluss

```
Benutzer-Eingabe (Markdown)
    ↓
Parser.parseEvents() → Event-Objekte
    ↓
Renderer.renderTimeline() → DOM-Elemente
    ↓
Search.applySearchAndFilter() → Gefilterte Ansicht
    ↓
Stats.calculate() → Statistiken
    ↓
Export.exportPdf/Png/Html() → Dateien
```

---

## Module im Detail

### 1. config.js

**Zweck:** Zentrale Konfiguration und Konstanten

**Wichtige Exports:**
- `Config.DEBOUNCE_DELAY` - Verzögerung für Input-Events (400ms)
- `Config.VALID_EVENT_CLASSES` - Array erlaubter Event-Klassen
- `Config.MONTH_NAME_TO_INDEX` - Mapping für Monatsnamen
- `Config.TEMPLATES` - Vordefinierte Templates

**Wann ändern:**
- Neue Event-Kategorien hinzufügen
- Neue Templates erstellen
- Timing-Konstanten anpassen

**Beispiel: Neue Event-Kategorie hinzufügen**
```javascript
// In config.js
VALID_EVENT_CLASSES: ["critical", "warning", "success", "meeting", "work", "urgent"]

// In styles.css entsprechende Klasse hinzufügen:
.timeline-content.is-urgent {
  background-color: #fff9e6;
  border-left: 5px solid #ff9800;
}
```

---

### 2. storage.js

**Zweck:** Persistierung und History-Verwaltung

**Wichtige Methoden:**
- `saveToLocalStorage(content)` - Speichert Markdown
- `loadFromLocalStorage()` - Lädt gespeicherten Inhalt
- `saveToHistory(value)` - Fügt zu Undo-History hinzu
- `undo(input, callback)` - Macht letzte Änderung rückgängig
- `redo(input, callback)` - Wiederholt rückgängig gemachte Änderung
- `saveTheme(theme)` / `loadTheme()` - Theme-Verwaltung

**State:**
- `undoHistory` - Array der vergangenen Zustände
- `redoHistory` - Array der rückgängig gemachten Zustände
- `isUndoRedoAction` - Flag um Rekursion zu vermeiden

**Wann ändern:**
- Neue Storage-Keys hinzufügen
- History-Größe anpassen
- Zusätzliche persistente Einstellungen

---

### 3. parser.js

**Zweck:** Parsing von Markdown und Datumswerten

**Wichtige Methoden:**
- `extractTitleFromMarkdown(text)` - Extrahiert Titel
- `parseDate(dateString)` - Parst flexible Datumsformate
- `parseEvents(bodyText, bodyOffset)` - Konvertiert Markdown zu Event-Objekten
- `calculateDuration(startDate, endDate)` - Berechnet Dauer-Label

**Event-Objekt-Struktur:**
```javascript
{
  date: Date,              // Haupt-Datum
  endDate: Date | null,    // End-Datum (optional)
  content: String,         // Markdown-Inhalt
  eventClass: String,      // CSS-Klasse (z.B. "is-critical")
  displayDateString: String | null,  // Custom Display
  explicitTimeProvided: Boolean,     // Hat User Zeit angegeben?
  startPos: Number,        // Position im Original-Text (für Scroll-to-Source)
  endPos: Number
}
```

**Wann ändern:**
- Neue Datumsformate unterstützen
- Parsing-Logik für neue Metadaten
- Event-Objekt-Struktur erweitern

**Beispiel: Neues Datumsformat hinzufügen**
```javascript
// In parseDate()
// Vor dem try/catch-Block:
const isoWeekMatch = dateString.match(/^(\d{4})-W(\d{2})$/);
if (isoWeekMatch) {
  const year = parseInt(isoWeekMatch[1]);
  const week = parseInt(isoWeekMatch[2]);
  // Berechne Datum der Woche...
  return { date: calculatedDate, displayString: `KW${week} ${year}`, hasTime: false };
}
```

---

### 4. renderer.js

**Zweck:** Visuelle Darstellung der Timeline

**Wichtige Methoden:**
- `renderTimeline(input, container)` - Haupt-Rendering-Funktion
- `renderEvent(event, index, allEvents, container)` - Einzelnes Event rendern
- `renderDurationBar(startItem, event, ...)` - Dauer-Balken zwischen Events
- `addTodayMarker(events, container)` - "Heute"-Marker einfügen
- `scrollToSource(start, end, input)` - Scroll zu Markdown-Position
- `getAllEvents()` - Gibt alle Events zurück

**State:**
- `allEvents` - Array aller gerenderten Events
- `cachedLineHeight` - Cache für Zeilen-Höhe

**Wann ändern:**
- Visuelles Design der Timeline
- Zusätzliche Timeline-Elemente
- Click-Handler für Events

**Beispiel: Click-Handler für Events hinzufügen**
```javascript
// In renderEvent(), nach contentDiv erstellt wurde:
contentDiv.addEventListener('click', (e) => {
  if (e.target.tagName === 'A') {
    // Handle link clicks
  }
});
```

---

### 5. search.js

**Zweck:** Suche und Filterung

**Wichtige Methoden:**
- `applySearchAndFilter(query, container)` - Wendet Such- und Filter-Logik an
- `highlightText(element, query)` - Hebt Suchbegriffe hervor
- `updateFilterButton(button, countElement)` - Aktualisiert Filter-Button
- `toggleFilter(value, isActive)` - Schaltet Filter ein/aus

**State:**
- `activeFilters` - Set der aktiven Filter-Kategorien

**Wann ändern:**
- Erweiterte Such-Optionen (RegEx, Fuzzy-Search)
- Zusätzliche Filter-Kriterien
- Such-Algorithmus optimieren

---

### 6. stats.js

**Zweck:** Statistik-Berechnung und -Darstellung

**Wichtige Methoden:**
- `calculate(events)` - Berechnet alle Statistiken
- `render()` - Rendert Statistiken im Modal
- `getStats()` - Gibt berechnete Stats zurück

**Stats-Objekt-Struktur:**
```javascript
{
  total: Number,
  upcoming: Number,
  past: Number,
  duration: Number,
  byClass: {
    critical: Number,
    warning: Number,
    ...
  }
}
```

**Wann ändern:**
- Neue Statistiken hinzufügen (z.B. Events pro Monat)
- Visualisierung verbessern
- Export von Statistiken

**Beispiel: Neue Statistik hinzufügen**
```javascript
// In calculate()
this.currentStats.thisMonth = 0;

events.forEach((event) => {
  const now = new Date();
  if (event.date.getMonth() === now.getMonth() && 
      event.date.getFullYear() === now.getFullYear()) {
    this.currentStats.thisMonth++;
  }
});

// In render() - neues stat-card im DOM hinzufügen
```

---

### 7. export.js

**Zweck:** Export in verschiedene Formate

**Wichtige Methoden:**
- `sanitizeFilename(name, fallback)` - Bereinigt Dateinamen
- `getDateTimePrefix()` - Erstellt Zeitstempel-Prefix
- `downloadFile(filename, content, mimeType)` - Trigger Download
- `exportMarkdown(content, getTitleFn)` - Export als .md
- `exportHtml(container, getTitleFn)` - Export als .html
- `exportPng(panel, getTitleFn, parseCallback)` - Export als .png
- `exportPdf(panel, getTitleFn, parseCallback)` - Export als .pdf

**Wann ändern:**
- Neue Export-Formate hinzufügen (z.B. JSON, CSV)
- Export-Optionen erweitern
- Dateinamen-Konventionen ändern

**Beispiel: JSON-Export hinzufügen**
```javascript
exportJson(events, getCurrentTitle) {
  const data = {
    title: getCurrentTitle(),
    exportDate: new Date().toISOString(),
    events: events.map(e => ({
      date: e.date.toISOString(),
      content: e.content,
      class: e.eventClass
    }))
  };
  
  const json = JSON.stringify(data, null, 2);
  const base = this.sanitizeFilename(getCurrentTitle(), "timeline");
  const prefix = this.getDateTimePrefix();
  this.downloadFile(`${prefix}-${base}.json`, json, "application/json");
}
```

---

### 8. app.js

**Zweck:** Haupt-Koordination und Event-Handling

**Wichtige Funktionen:**
- `init()` - Initialisiert Anwendung
- `cacheDOMElements()` - Speichert DOM-Referenzen
- `setupEventListeners()` - Registriert alle Event-Listener
- `parseAndRenderTimeline()` - Koordiniert Parsing und Rendering
- `handleKeyDown(event)` - Keyboard-Shortcuts
- `handleVisualize()` - Visualisierung + Fullscreen

**DOM-Element Cache:**
```javascript
elements = {
  markdownInput: ...,
  visualizeBtn: ...,
  timelineOutput: ...,
  // etc.
}
```

**Wann ändern:**
- Neue UI-Elemente hinzufügen
- Neue Event-Listener registrieren
- Neue Keyboard-Shortcuts
- Modul-Koordination anpassen

---

## Features hinzufügen

### Schritt-für-Schritt: Neues Feature implementieren

#### Beispiel: "Event-Tagging" Feature

**Ziel:** Events können mit #tags versehen werden, die dann filterbar sind.

**1. Config erweitern (config.js)**
```javascript
// Neue Regex für Tag-Erkennung
TAG_REGEX: /#[\w-]+/g
```

**2. Parser erweitern (parser.js)**
```javascript
// In parseEvents(), innerhalb der Event-Schleife:
const tags = [];
const tagMatches = eventStr.matchAll(TimelineApp.Config.TAG_REGEX);
for (const match of tagMatches) {
  tags.push(match[0]);
}
eventData.tags = tags;
```

**3. Renderer erweitern (renderer.js)**
```javascript
// In renderEvent(), nach contentDiv erstellt:
if (event.tags && event.tags.length > 0) {
  const tagContainer = document.createElement('div');
  tagContainer.className = 'event-tags';
  event.tags.forEach(tag => {
    const tagSpan = document.createElement('span');
    tagSpan.className = 'tag';
    tagSpan.textContent = tag;
    tagContainer.appendChild(tagSpan);
  });
  contentDiv.appendChild(tagContainer);
}
```

**4. CSS hinzufügen (styles.css)**
```css
.event-tags {
  margin-top: 10px;
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.tag {
  background-color: var(--primary-color);
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8em;
}
```

**5. Search erweitern (search.js)**
```javascript
// In applySearchAndFilter():
// Tags in Suche einbeziehen
const eventTags = item.dataset.tags || '';
passesSearch = textContent.includes(query) || eventTags.includes(query);
```

**6. UI erweitern (index.html + app.js)**
```html
<!-- Neuer Filter-Button für Tags -->
<div class="filter-option">
  <input type="checkbox" id="filter-has-tags" value="has-tags" checked />
  <label for="filter-has-tags">Mit Tags</label>
</div>
```

---

## Code-Konventionen

### JavaScript

**Namensgebung:**
- `camelCase` für Funktionen und Variablen
- `PascalCase` für Module (in Namespace)
- `SCREAMING_SNAKE_CASE` für Konstanten

**Kommentare:**
```javascript
/**
 * Kurzbeschreibung der Funktion
 * 
 * @param {Type} paramName - Beschreibung
 * @returns {Type} Beschreibung
 */
function exampleFunction(paramName) {
  // Inline-Kommentar für komplexe Logik
}
```

**Fehlerbehandlung:**
```javascript
try {
  // Code
} catch (e) {
  console.error("Kontext:", e);
  // User-freundliche Fehlermeldung
}
```

### CSS

**Struktur:**
```css
/* Hauptbereich-Kommentar */

/* Unterbereich */
.class-name {
  /* Alphabetisch sortierte Properties */
  background-color: var(--variable);
  color: var(--text-color);
}

/* Responsive / States */
.class-name:hover {
  /* Hover-States */
}
```

**CSS-Variablen:**
Alle Farben und wiederverwendbare Werte als CSS-Variablen in `:root` und `[data-theme="dark"]`

### Markdown-Format

**Event-Syntax:**
```markdown
date: YYYY-MM-DD HH:MM:SS
end_date: YYYY-MM-DD (optional)
class: category (optional)
## Titel (optional)
Inhalt in Markdown

---
nächstes Event...
```

**Unterstützte Datumsformate:**
- ISO: `2025-01-15`, `2025-01-15 14:30:00`
- Deutsch: `15.01.2025`, `15.01.2025 14:30`
- Quartale: `Q1 2025`, `2025 Q1`
- Monate: `Januar 2025`, `2025 Januar`

---

## Technische Details

### Browser-Kompatibilität

**Mindestanforderungen:**
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

**Verwendete APIs:**
- LocalStorage
- FileReader API
- Blob API
- Canvas API (für PNG-Export)

### Performance-Überlegungen

**Bottlenecks:**
- DOM-Manipulation bei >500 Events
- PNG-Export bei sehr langen Timelines
- Suche ohne Debouncing

**Optimierungen:**
- Debouncing für Input-Events (400ms)
- Lazy Rendering für Duration-Bars (50ms Delay)
- Caching von berechneten Werten

### Sicherheit

**Aktuelle Schwachstellen:**
- `marked.parse()` ohne Sanitization → XSS-Risiko bei externen Markdown-Dateien
- `innerHTML` für gerenderten Content

**Empfohlene Verbesserungen:**
```javascript
// In renderer.js, vor marked.parse():
import DOMPurify from 'dompurify';
contentDiv.innerHTML = DOMPurify.sanitize(marked.parse(event.content));
```

### LocalStorage-Limits

- Typisch 5-10 MB pro Domain
- Bei großen Timelines könnte Limit erreicht werden
- Fehlerbehandlung vorhanden, aber User sollte informiert werden

### Erweiterbarkeit

**Plugin-System (Vorschlag):**
```javascript
TimelineApp.Plugins = {
  register(name, plugin) {
    this[name] = plugin;
    if (plugin.init) plugin.init();
  }
};

// Usage:
TimelineApp.Plugins.register('customExport', {
  init() { /* Setup */ },
  export(data) { /* Export logic */ }
});
```

---

## Häufige Aufgaben

### Neue Event-Kategorie hinzufügen

1. `config.js`: Zu `VALID_EVENT_CLASSES` hinzufügen
2. `styles.css`: Styling-Regeln für `.timeline-content.is-YOUR_CLASS` erstellen
3. `index.html`: Filter-Option im Filter-Menü hinzufügen
4. `search.js`: Zu `activeFilters` Default-Set hinzufügen

### Neues Export-Format

1. `export.js`: Neue Methode `exportYourFormat()` erstellen
2. `index.html`: Button hinzufügen
3. `app.js`: Event-Listener registrieren

### UI-Element hinzufügen

1. `index.html`: Element mit ID hinzufügen
2. `styles.css`: Styling hinzufügen
3. `app.js`: In `cacheDOMElements()` referenzieren
4. `app.js`: Event-Listener in `setupEventListeners()` hinzufügen

### Neues Template erstellen

1. `config.js`: In `TEMPLATES`-Objekt hinzufügen
2. Template wird automatisch im Modal angezeigt

---

## Debugging-Tipps

**Console-Logging:**
```javascript
// Aktivieren Sie detailliertes Logging:
TimelineApp.DEBUG = true;

// In relevanten Funktionen:
if (TimelineApp.DEBUG) {
  console.log('Parser: Events parsed:', events);
}
```

**Event-Inspektion:**
```javascript
// In Browser-Console:
TimelineApp.Renderer.getAllEvents()  // Alle Events anzeigen
TimelineApp.Stats.getStats()         // Aktuelle Statistiken
TimelineApp.Search.getActiveFilters() // Aktive Filter
```

**DOM-Breakpoints:**
- Chrome DevTools: Rechtsklick auf Timeline-Element → "Break on" → "Subtree modifications"

---

## Bekannte Limitationen

1. **Keine Konflikt-Erkennung** bei überlappenden Duration-Events
2. **PDF-Export** kann bei sehr langen Timelines langsam sein
3. **Keine Collaborative Editing** Features
4. **LocalStorage-Limit** kann erreicht werden
5. **Keine Verschlüsselung** der gespeicherten Daten
6. **Kein Diff-Viewer** für History

---

## Lizenz

Dieses Projekt ist Open Source. Bitte prüfen Sie die Lizenzen der verwendeten Bibliotheken:
- Marked.js: MIT
- html2canvas: MIT  
- jsPDF: MIT

---

## Kontakt & Beiträge

Für Verbesserungsvorschläge oder Bug-Reports erstellen Sie bitte ein Issue oder Pull Request.

---

**Version:** 2.0.0 (Modular)  
**Letzte Aktualisierung:** 2025-01-04
