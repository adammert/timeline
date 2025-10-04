/**
 * Configuration and Constants for Timeline Visualizer
 */

// Initialize global namespace
window.TimelineApp = window.TimelineApp || {};

TimelineApp.Config = {
  // Timing Constants
  DEBOUNCE_DELAY: 400,
  AUTOSAVE_DELAY: 1000,
  SEARCH_DELAY: 300,
  AUTOSAVE_INDICATOR_DURATION: 2000,
  
  // Storage Keys
  AUTOSAVE_KEY: "timeline_autosave",
  AUTOSAVE_TIMESTAMP_KEY: "timeline_autosave_timestamp",
  HISTORY_KEY: "timeline_history",
  THEME_KEY: "timeline_theme",
  
  // History Settings
  MAX_HISTORY_SIZE: 50,
  HISTORY_SAVE_SIZE: 20,
  
  // Valid Event Classes
  VALID_EVENT_CLASSES: ["critical", "warning", "success", "meeting", "work"],
  
  // Month Name Mapping (German/English)
  MONTH_NAME_TO_INDEX: {
    januar: 0, jan: 0,
    februar: 1, feb: 1,
    märz: 2, mär: 2, mar: 2,
    april: 3, apr: 3,
    mai: 4, may: 4,
    juni: 5, jun: 5,
    juli: 6, jul: 6,
    august: 7, aug: 7,
    september: 8, sep: 8,
    oktober: 9, okt: 9, oct: 9,
    november: 10, nov: 10,
    dezember: 11, dez: 11, dec: 11
  },

  // Templates
  TEMPLATES: {
    project: {
      title: "Projekt-Timeline",
      description: "Standard Projekt mit Phasen und Meilensteinen",
      content: `title: Mein Projekt

date: 2025-01-15
class: meeting
## Projekt Kick-off
- Ziele definieren
- Team zusammenstellen
- Zeitplan festlegen

---
date: 2025-01-15
end_date: 2025-03-31
class: work
## Phase 1: Planung & Design
Detaillierte Konzeptionsphase

---
date: 2025-03-31
class: success
## Meilenstein: Design abgeschlossen
Design-Freigabe erhalten

---
date: 2025-04-01
end_date: 2025-07-31
class: work
## Phase 2: Implementierung
Hauptentwicklungsphase

---
date: 2025-07-31
class: critical
## Deadline: Go-Live
Produktivsetzung muss erfolgen!

---
date: 2025-08-15
class: meeting
## Projekt Review
Lessons Learned & Retrospektive`
    },
    
    sprint: {
      title: "Agile Sprint Planning",
      description: "2-Wochen Sprint mit Daily Standups",
      content: `title: Sprint 24

date: 2025-01-06
class: meeting
## Sprint Planning
- Story Points schätzen
- Sprint Backlog festlegen

---
date: 2025-01-06
end_date: 2025-01-19
class: work
## Sprint 24 Entwicklung
2-Wochen Sprint Entwicklungsphase

---
date: 2025-01-13
class: meeting
## Sprint Review
Zwischenstand präsentieren

---
date: 2025-01-19
class: success
## Sprint Demo & Retrospektive
Ergebnisse präsentieren`
    },
    
    migration: {
      title: "System Migration",
      description: "IT-Migrationsprojekt mit kritischen Deadlines",
      content: `title: Exchange Migration 2025

date: 2025-02-01
class: warning
## Vorbereitungsphase Start
- Inventar erstellen
- Risiken analysieren

---
date: 2025-02-01
end_date: 2025-03-15
class: work
## Testmigration Phase
Pilotgruppen migrieren

---
date: 2025-03-15
class: success
## Test abgeschlossen
Alle Tests erfolgreich

---
date: 2025-04-01
end_date: 2025-06-30
class: work
## Hauptmigration
Schrittweise Migration aller User

---
date: 2025-06-30
class: critical
## End-of-Life Altsystem
Altsystem wird abgeschaltet!

---
date: 2025-07-15
class: meeting
## Post-Migration Review
Finale Auswertung`
    },
    
    quarterly: {
      title: "Quartalsplanung",
      description: "Quartalsziele und Reviews",
      content: `title: Jahresplanung 2025

date: Q1 2025
class: work
## Q1: Grundlagen schaffen
- Infrastruktur aufbauen
- Team erweitern

---
date: Q2 2025
class: work
## Q2: Wachstumsphase
- Produktlaunch
- Marketing intensivieren

---
date: Q3 2025
class: warning
## Q3: Optimierung
- Performance verbessern
- Kosten senken

---
date: Q4 2025
class: success
## Q4: Jahresabschluss
- Ziele erreichen
- Planung 2026`
    },
    
    personal: {
      title: "Persönliche Ziele",
      description: "Jahres- und Monatsziele tracken",
      content: `title: Meine Ziele 2025

date: Januar 2025
class: work
## Neues Jahr starten
- Ziele definieren
- Gewohnheiten etablieren

---
date: 2025-03-01
class: meeting
## Fortschrittscheck Q1
Status der Quartalsziele

---
date: 2025-06-01
end_date: 2025-06-30
class: success
## Urlaub
Erholung und Reflexion

---
date: 2025-09-15
class: warning
## Zwischenauswertung
Korrekturen vornehmen

---
date: Dezember 2025
class: success
## Jahresrückblick
Erfolge feiern`
    },
    
    event: {
      title: "Event-Planung",
      description: "Konferenz oder Event organisieren",
      content: `title: Firmen-Konferenz 2025

date: 2025-03-01
class: meeting
## Planungskomitee Start
Erste Konzeptideen

---
date: 2025-03-01
end_date: 2025-05-31
class: work
## Vorbereitungsphase
- Location buchen
- Speaker einladen
- Marketing starten

---
date: 2025-05-31
class: warning
## Early Bird Deadline
Frühbucher-Rabatt endet

---
date: 2025-07-01
class: critical
## Anmeldeschluss
Keine weiteren Anmeldungen

---
date: 2025-08-15
end_date: 2025-08-17
class: success
## Konferenz Tage
Die Konferenz findet statt!

---
date: 2025-08-30
class: meeting
## Nachbereitung
Feedback auswerten`
    }
  }
};
