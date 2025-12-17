# Timeline Visualizer - Hilfe & Dokumentation

**Version 1.1** | Alle Daten werden nur lokal im Browser gespeichert

---

## 📑 Inhaltsverzeichnis

- [Markdown-Syntax](#markdown-syntax)
- [Datumsformate](#datumsformate)
- [Event-Kategorien](#event-kategorien)
- [Bilder einfügen](#bilder-einfugen)
- [Tastenkombinationen](#tastenkombinationen)
- [Export-Optionen](#export-optionen)
- [Präsentationsmodus](#prasentationsmodus)
- [Tipps & Tricks](#tipps-tricks)
- [Changelog](#changelog)
- [Technische Informationen](#technische-informationen)

---

## 📝 Markdown-Syntax

Ereignisse werden durch `---` getrennt und folgen diesem Format:

```
date: 2025-01-15 14:30:00
end_date: 2025-01-20 (optional)
class: warning (optional)
## Titel (optional)
Inhalt in Markdown-Format
- Listen
- **Fett**
- *Kursiv*

---
Nächstes Ereignis...
```

---

## 📅 Datumsformate

Die Timeline unterstützt verschiedene Datumsformate:

- **ISO-Format:** `2025-01-15` oder `2025-01-15 14:30:00`
- **Deutsches Format:** `15.01.2025` oder `15.01.2025 14:30`
- **Quartale:** `Q1 2025` oder `2025 Q1`
- **Monatsnamen:** `Januar 2025` oder `2025 Januar`

---

## 🎨 Event-Kategorien

Verwende `class:` um Events farblich zu kategorisieren:

- `class: critical` - Kritische Ereignisse (rot)
- `class: warning` - Warnungen (orange)
- `class: success` - Erfolge (grün)
- `class: meeting` - Meetings (lila)
- `class: work` - Arbeit (blau)

Ohne `class:` werden Events neutral dargestellt.

---

## 🖼️ Bilder einfügen

**NEU in Version 1.1!**

### Bilder hinzufügen:
- **Drag & Drop:** Ziehe Bilder direkt ins Markdown-Textfeld
- **Screenshot einfügen:** Drücke `Strg+V` im Textfeld
- **Manuell:** `![Beschreibung](images/bild.png)`

### Speicherung:
- Bilder werden lokal in IndexedDB gespeichert
- Keine Server-Uploads erforderlich
- Maximale Bildgröße: 10 MB

### Export:
- **HTML-Export:** Bilder werden als Base64 eingebettet (Standalone-Datei)
- **Markdown-Export:** Bilder werden im `images/` Ordner gespeichert (erfordert Chrome/Edge)

---

## ⌨️ Tastenkombinationen

| Tastenkombination | Funktion |
|-------------------|----------|
| `Strg+Enter` | Präsentation öffnen/schließen |
| `Strg+S` | Markdown speichern |
| `Strg+F` | Suche fokussieren |
| `Strg+V` | Screenshot einfügen |
| `Strg+Z` | Rückgängig |
| `Strg+Y` | Wiederherstellen |
| `ESC` | Präsentation/Modals schließen |

---

## 💾 Export-Optionen

### Markdown speichern
- **Ohne Bilder:** Standard .md Datei
- **Mit Bildern:** Erstellt Ordner mit `timeline.md` + `images/` Unterordner
  - Erfordert File System Access API (Chrome/Edge)

### HTML speichern
- Standalone HTML-Datei
- Bilder als Base64 eingebettet
- Vollständig offline verwendbar
- Theme-Einstellung wird übernommen

### PNG speichern
- Timeline als hochauflösendes Bild
- Perfekt für Dokumentation

### PDF speichern
- Timeline als PDF-Dokument
- Ideal zum Ausdrucken

---

## 🎬 Präsentationsmodus

Öffnet ein separates Fenster (1920×1080 FullHD) ideal für Präsentationen:

- **Live-Synchronisation:** Änderungen werden sofort übertragen
- **Filter & Suche:** Werden automatisch synchronisiert
- **Theme:** Verwendet aktuelles Theme (Hell/Dunkel)
- **Bilder:** Werden automatisch angezeigt

**Tipp:** Nutze den Präsentationsmodus auf einem zweiten Monitor/Beamer während du im Hauptfenster editierst!

---

## 💡 Tipps & Tricks

### Dauer-Events
Verwende `end_date:` um Events mit Zeitspanne darzustellen:
```
date: 2025-01-15
end_date: 2025-03-31
class: work
## Projektphase 1
Entwicklung und Testing
```
Dies erzeugt visuelle Verbindungslinien in der Timeline.

### Navigation
- Klicke auf das **Datum** eines Events um zur Markdown-Quelle zu springen
- Nutze **Filter** um Events nach Kategorie ein-/auszublenden
- Verwende **Suche** um schnell bestimmte Events zu finden

### Templates
- Klicke auf 📄 für vorgefertigte Templates
- Verfügbare Templates: Projekt, Sprint, Migration, Quartalsplanung, Persönliche Ziele, Event-Planung

### Datensicherheit
- Alle Daten werden nur lokal im Browser gespeichert
- Kein Server, keine Cloud, keine Datenübertragung
- Auto-Save alle paar Sekunden
- Undo/Redo-Historie (letzte 50 Änderungen)

---

## 📋 Changelog

### Version 1.3 - Bugfixes & Code-Qualität (Dezember 2024)

#### 🐛 Bugfixes:
- **EventType-Konsistenz:** Entfernung des unbenutzten `info` Event-Types
- **Dependency Injection:** Saubere Architektur für Images-Service im Renderer
- **Error Handling:** Robuste Fehlerbehandlung bei Initialisierung
- **Null-Safety:** Verbesserte Null-Checks in Parser und Export-Modul
- **Memory Leak:** Präsentationsfenster wird nun beim Schließen des Hauptfensters automatisch geschlossen
- **Drag & Drop:** Besseres Handling von gemischten Datei-Typen (Bilder + Markdown)
- **Export-Stabilität:** Sichere Title-Extraktion in allen Export-Formaten

#### 🔧 Technische Verbesserungen:
- TypeScript Strict Mode vollständig erfüllt
- Verbesserte Race Condition Prevention im Drag & Drop Handler
- Cleanup von Event-Listenern zur Vermeidung von Memory Leaks
- Robusteres Error Handling mit benutzerfreundlichen Fehlermeldungen

---

### Version 1.1 - Bild-Support (Januar 2025)

#### 🎉 Neue Features:
- ✨ **Bilder per Drag & Drop:** Ziehe Bilder direkt ins Textfeld
- ✨ **Screenshot-Paste:** `Strg+V` fügt Screenshots direkt ein
- 💾 **IndexedDB-Speicherung:** Bilder werden lokal persistent gespeichert
- 📤 **HTML-Export mit Bildern:** Base64-eingebettet für Standalone-Dateien
- 📤 **Markdown-Export mit images/:** Ordnerstruktur mit File System Access API
- 🎨 **Bilder in Präsentation:** Werden automatisch im Präsentationsmodus angezeigt
- 🌓 **Theme-Support im Export:** Hell/Dunkel-Modus auch im HTML-Export

#### 🐛 Bugfixes:
- Konsolenfehler beim Rendering behoben
- DOM-Rendering-Prozess optimiert
- Cache-Probleme bei Aktualisierungen gelöst

#### 📝 Technische Details:
Bilder werden als `![alt](images/filename.png)` im Markdown referenziert für maximale Git-Kompatibilität. Die Dateien werden mit eindeutigen Zeitstempel-Namen versehen um Kollisionen zu vermeiden.

---

### Version 1.0 - Initial Release (Dezember 2024)

#### Features:
- 📝 Markdown-basierte Timeline-Erstellung
- 🎨 Flexible Event-Kategorien mit Farbcodierung (5 Typen)
- 📅 Multiple Datumsformate (ISO, Deutsch, Quartale, Monate)
- ⏱️ Dauer-Events mit visuellen Verbindungslinien
- 🔍 Live-Suche mit Highlighting
- 🎯 Filter nach Kategorien
- 📊 Statistik-Dashboard mit Verteilung
- 📋 6 vorgefertigte Templates
- 💾 Auto-Save mit LocalStorage
- ⏮️ Undo/Redo-Funktion (50 Schritte)
- 🌓 Hell/Dunkel-Theme
- 🎬 Präsentationsmodus (1920×1080)
- 📤 Export: Markdown, HTML, PNG, PDF
- ⌨️ Umfangreiche Tastenkombinationen
- 🎯 "Heute"-Marker in Timeline

---

## 🔧 Technische Informationen

### System-Anforderungen
- **Browser:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **JavaScript:** ES6+ erforderlich
- **APIs:** LocalStorage, IndexedDB, File System Access API (optional)

### Verwendete Technologien
- **Frontend:** Vanilla JavaScript (kein Framework)
- **Markdown:** Marked.js
- **Bildverarbeitung:** FileReader API, IndexedDB
- **Export:** html2canvas, jsPDF
- **Kommunikation:** BroadcastChannel API

### Browser-Speicher
- **LocalStorage:** Markdown-Text, Theme, Einstellungen (~5-10 MB)
- **IndexedDB:** Bilder (~50 MB typisch, browserabhängig)

### Datenschutz & Sicherheit
- ✅ Alle Daten bleiben lokal im Browser
- ✅ Keine Server-Kommunikation
- ✅ Keine Tracking-Tools
- ✅ Keine Cookies
- ✅ Open Source Code

### Bekannte Einschränkungen
- File System Access API nur in Chrome/Edge verfügbar
- IndexedDB kann in Privat-/Inkognito-Modus eingeschränkt sein
- Maximale Bildgröße abhängig vom Browser-Speicher
- PDF-Export kann bei sehr langen Timelines langsam sein

---

## 🆘 Probleme?

### Bilder werden nicht angezeigt
1. Prüfe ob IndexedDB aktiviert ist (Debug-Button 🔍)
2. Prüfe Browser-Einstellungen (Cookies/LocalStorage)
3. Teste im Normal-Modus (nicht Inkognito)

### Export funktioniert nicht
1. Popup-Blocker deaktivieren
2. Browser aktualisieren
3. Cache leeren (Strg+F5)

### Daten verloren?
- LocalStorage prüfen (Browser-Entwicklertools)
- Auto-Save Timestamp überprüfen
- Undo-Historie verwenden (Strg+Z)

Für weitere Hilfe: Debug-Button 🔍 ausführen und Ausgabe prüfen.

---

**Timeline Visualizer v1.1** | Made with ❤️ | 100% Client-Side | Open Source
