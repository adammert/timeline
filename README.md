# Timeline Visualizer v2.0 - TypeScript Edition

Modern timeline visualization tool with TypeScript, Vite, and npm.

## 🚀 Schnellstart

### Voraussetzungen

- **Node.js** (v18 oder höher) - [Download](https://nodejs.org/)
- **npm** (kommt mit Node.js)

### Installation & Start

```bash
# 1. Dependencies installieren
npm install

# 2. Development-Server starten
npm run dev

# Browser öffnet automatisch auf http://localhost:3000
```

Das war's! Die Anwendung läuft jetzt im Development-Modus mit Hot Module Replacement.

---

## 📦 Verfügbare Befehle

```bash
# Development-Server starten (mit HMR)
npm run dev

# Production-Build erstellen
npm run build

# Production-Build lokal testen
npm run preview

# TypeScript-Fehler prüfen
npm run type-check

# Code mit Prettier formatieren
npm run format

# Code mit ESLint prüfen
npm run lint
```

---

## 🏗️ Projektstruktur

```
timeline/
├── src/
│   ├── types.ts              # TypeScript Type Definitions
│   ├── config.ts             # Konfiguration & Konstanten
│   ├── storage.ts            # LocalStorage Management
│   ├── parser.ts             # Datums- & Event-Parsing
│   ├── renderer.ts           # Timeline-Rendering
│   ├── search.ts             # Suche & Filter
│   ├── stats.ts              # Statistiken
│   ├── export.ts             # Export (MD, HTML, PNG, PDF)
│   ├── images.ts             # Bildverwaltung (IndexedDB)
│   ├── presentation.ts       # Präsentationsmodus
│   ├── app.ts                # Haupt-Koordination
│   ├── main.ts               # Entry-Point für index.html
│   ├── presentation-main.ts  # Entry-Point für presentation.html
│   └── styles/
│       └── styles.css        # Alle Styles
├── index.html                # Hauptseite
├── presentation.html         # Präsentationsseite (1920x1080)
├── package.json              # npm Configuration
├── tsconfig.json             # TypeScript Configuration
└── vite.config.ts            # Vite Build Configuration
```

---

## ✨ Features

### Kern-Funktionen
- 📅 **Flexible Datumsformate** - ISO, Deutsch (DD.MM.YYYY), Quartale, Monatsnamen
- 🎨 **Event-Types** - Critical, Warning, Success, Meeting, Work
- 🏊 **Swimlane-Modus** - Events in parallelen Bahnen gruppieren
- ⏱️ **Duration-Events** - Zeitspannen mit visuellen Verbindungslinien
- 📝 **Markdown-Support** - Formatierte Event-Beschreibungen
- 🖼️ **Bilder** - Drag & Drop, Screenshot-Paste, IndexedDB-Speicherung

### UI & UX
- 🌓 **Dark/Light Theme** - Automatisches Theme-Switching
- 🔍 **Live-Suche** - Mit Highlighting
- 🎯 **Filter** - Nach Event-Typen filtern
- 📊 **Statistiken** - Event-Verteilung & Analysen
- 💾 **Auto-Save** - LocalStorage mit History (Undo/Redo)
- 🎬 **Präsentationsmodus** - Separates Fenster (FullHD)

### Export
- 📄 **Markdown** - Exportiere Timeline als .md
- 🌐 **HTML** - Standalone HTML-Datei
- 🖼️ **PNG** - Screenshot der Timeline
- 📑 **PDF** - Druckfertiges PDF

---

## 🔧 Technologie-Stack

### Frontend
- **TypeScript** - Type-safe JavaScript
- **Vite** - Modern Build Tool (ESBuild)
- **marked** - Markdown-Parser
- **html2canvas** - Screenshot-Rendering
- **jsPDF** - PDF-Generierung

### Development
- **ESLint** - Code-Qualität
- **Prettier** - Code-Formatierung
- **IndexedDB** - Browser-Datenbank für Bilder
- **LocalStorage** - Persistierung
- **BroadcastChannel** - Präsentations-Sync

---

## 🆕 Was ist neu in v2.0?

### Vollständige TypeScript-Migration
- ✅ Alle Module nach TypeScript konvertiert
- ✅ Strikte Type-Checking
- ✅ ES6 Modules statt globalem Namespace
- ✅ IntelliSense & Auto-Complete

### Moderner Build-Stack
- ✅ Vite statt No-Build-Approach
- ✅ Hot Module Replacement (HMR)
- ✅ npm statt CDN-Dependencies
- ✅ Tree-Shaking & Code-Splitting

### Developer Experience
- ✅ ESLint + Prettier Integration
- ✅ Source Maps für Debugging
- ✅ Type-Safe Refactoring
- ✅ Bessere Fehler-Meldungen

---

## 🐛 Bekannte Probleme

### TypeScript-Warnungen
- ~40 TypeScript-Warnungen ("possibly undefined")
- **Nicht kritisch** - Build funktioniert einwandfrei
- Werden schrittweise behoben

### Browser-Kompatibilität
- **Chrome/Edge 90+** - Vollständig unterstützt
- **Firefox 88+** - Vollständig unterstützt
- **Safari 14+** - Vollständig unterstützt
- **IE** - ❌ Nicht unterstützt

---

## 📖 Verwendung

### Einfaches Beispiel

```markdown
title: Mein Projekt

date: 2025-01-15
class: meeting
## Projekt Kick-off
- Ziele definieren
- Team zusammenstellen

---
date: 2025-01-15
end_date: 2025-03-31
class: work
group: Development
## Phase 1: Entwicklung
Hauptentwicklungsphase des Projekts.

---
date: 2025-03-31
class: success
## Meilenstein: Release 1.0
Erste Version ist live!
```

### Datumsformate

```markdown
# ISO-Format
date: 2025-01-15

# Deutsches Format
date: 15.01.2025

# Mit Uhrzeit
date: 15.01.2025 14:30

# Quartale
date: Q1 2025

# Monatsnamen
date: Januar 2025
```

### Swimlanes (Gruppierung)

```markdown
date: 2025-01-01
end_date: 2025-06-30
class: work
group: Frontend
## Frontend-Entwicklung

---
date: 2025-01-01
end_date: 2025-06-30
class: work
group: Backend
## Backend-Entwicklung
```

---

## 🔒 Datenschutz & Sicherheit

- ✅ **100% Offline** - Keine Server-Kommunikation
- ✅ **Lokale Speicherung** - Alle Daten bleiben im Browser
- ✅ **Keine Cookies** - Nur LocalStorage & IndexedDB
- ✅ **Open Source** - Vollständig transparent

---

## 🤝 Mitwirken

Pull Requests sind willkommen! Für größere Änderungen bitte zuerst ein Issue öffnen.

### Development-Workflow

```bash
# Repository klonen
git clone <repo-url>

# Dependencies installieren
npm install

# Dev-Server starten
npm run dev

# Änderungen testen
npm run type-check
npm run lint

# Build testen
npm run build
npm run preview
```

---

## 📄 Lizenz

ISC License

---

## 🙏 Danksagungen

- **marked** - Markdown-Parsing
- **html2canvas** - Screenshot-Funktionalität
- **jsPDF** - PDF-Export
- **Vite** - Build-Tooling
- **TypeScript** - Type Safety

---

## 📞 Support

Bei Problemen oder Fragen:
- 🐛 [Issue erstellen](https://github.com/adammert/timeline/issues)
- 📖 [Dokumentation lesen](./help.md)
- 💬 Fragen in Discussions

---

**Viel Spaß mit Timeline Visualizer v2.0!** 🎉
