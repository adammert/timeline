/**
 * Configuration and Constants for Timeline Visualizer
 */

import type { EventType, TemplateData } from './types';

export const TIMING = {
  DEBOUNCE_DELAY: 400,
  AUTOSAVE_DELAY: 1000,
  SEARCH_DELAY: 300,
  AUTOSAVE_INDICATOR_DURATION: 2000,
} as const;

export const STORAGE_KEYS = {
  AUTOSAVE: 'timeline_autosave',
  AUTOSAVE_TIMESTAMP: 'timeline_autosave_timestamp',
  HISTORY: 'timeline_history',
  THEME: 'timeline_theme',
  SWIMLANE: 'timeline_swimlane_preference',
} as const;

export const HISTORY = {
  MAX_SIZE: 50,
  SAVE_SIZE: 20,
} as const;

export const VALID_EVENT_CLASSES: EventType[] = [
  'critical',
  'warning',
  'success',
  'meeting',
  'work',
];

export const MONTH_NAME_TO_INDEX: Record<string, number> = {
  januar: 0,
  jan: 0,
  februar: 1,
  feb: 1,
  märz: 2,
  mär: 2,
  mar: 2,
  april: 3,
  apr: 3,
  mai: 4,
  may: 4,
  juni: 5,
  jun: 5,
  juli: 6,
  jul: 6,
  august: 7,
  aug: 7,
  september: 8,
  sep: 8,
  oktober: 9,
  okt: 9,
  oct: 9,
  november: 10,
  nov: 10,
  dezember: 11,
  dez: 11,
  dec: 11,
};

export const TEMPLATES: Record<string, TemplateData> = {
  project: {
    name: 'Projekt-Timeline',
    description: 'Standard Projekt mit Phasen und Meilensteinen',
    content: `title: Mein Projekt

date: 2025-01-15
class: meeting
group: General
## Projekt Kick-off
- Ziele definieren
- Team zusammenstellen
- Zeitplan festlegen

---
date: 2025-01-15
end_date: 2025-03-31
class: work
group: Frontend
## Phase 1: Planung & Design Frontend
Detaillierte Konzeptionsphase für das Frontend.

---
date: 2025-01-20
end_date: 2025-03-25
class: work
group: Backend
## Phase 1: Planung & Design Backend
Detaillierte Konzeptionsphase für das Backend.

---
date: 2025-03-31
class: success
group: Frontend
## Meilenstein: Frontend Design abgeschlossen
Design-Freigabe für Frontend erhalten.

---
date: 2025-03-25
class: success
group: Backend
## Meilenstein: Backend Design abgeschlossen
Design-Freigabe für Backend erhalten.

---
date: 2025-04-01
end_date: 2025-07-31
class: work
group: Frontend
## Phase 2: Frontend Implementierung
Hauptentwicklungsphase des Frontends.

---
date: 2025-04-05
end_date: 2025-07-25
class: work
group: Backend
## Phase 2: Backend Implementierung
Hauptentwicklungsphase des Backends.

---
date: 2025-07-31
class: critical
group: General
## Deadline: Go-Live
Produktivsetzung muss erfolgen!

---
date: 2025-08-15
class: meeting
group: General
## Projekt Review
Lessons Learned & Retrospektive`,
  },

  sprint: {
    name: 'Agile Sprint Planning',
    description: '2-Wochen Sprint mit Daily Standups',
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
Ergebnisse präsentieren`,
  },

  migration: {
    name: 'System Migration',
    description: 'IT-Migrationsprojekt mit kritischen Deadlines',
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
Finale Auswertung`,
  },

  quarterly: {
    name: 'Quartalsplanung',
    description: 'Quartalsziele und Reviews',
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
- Planung 2026`,
  },

  personal: {
    name: 'Persönliche Ziele',
    description: 'Jahres- und Monatsziele tracken',
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
Erfolge feiern`,
  },

  event: {
    name: 'Event-Planung',
    description: 'Konferenz oder Event organisieren',
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
Feedback auswerten`,
  },
};
