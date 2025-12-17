# Timeline Visualizer Redesign Plan

**Erstellt:** 2024-12-17
**Version:** 1.0
**Ziel:** Modernes UI-Redesign basierend auf redesign/code.html

---

## 📋 Design-Analyse

### Neue Design-Features aus code.html:

1. **Tailwind CSS Framework** - Moderne Utility-First CSS-Architektur
2. **Material Icons Round** - Professionelle Icon-Library
3. **Inter & JetBrains Mono Fonts** - Moderne Typografie
4. **Dark Mode First** - Primär dunkles Design mit Light Mode Toggle
5. **Syntax-Highlighting im Editor** - Farbige Keywords, Strings, Dates
6. **Glow-Effekte** - Subtile Shadow-Effekte bei Hover
7. **Moderne Timeline-Cards** - Abgerundete Karten mit Gradient-Overlays
8. **Responsive Icon-Buttons** - Material Icons statt Text
9. **Zeilennummern im Editor** - VS Code-ähnliche Editor-Experience
10. **Bessere Farbpalette** - Zinc/Gray für Dark Mode, moderne Primärfarben

---

## 🎨 Design-System Vergleich

| Element | Aktuell | Neu (Redesign) |
|---------|---------|----------------|
| CSS Framework | Custom CSS | Tailwind CSS |
| Icons | Text/Emojis | Material Icons Round |
| Fonts | System Fonts | Inter + JetBrains Mono |
| Editor | Plain Textarea | Contenteditable mit Syntax-Highlighting |
| Dark Mode | CSS Variables | Tailwind Dark Classes |
| Timeline Cards | Border-Left + Shadow | Rounded + Gradient + Glow |
| Layout | Fixed Width Panels | Flex-based 5/12 Split |
| Buttons | Custom Styled | Tailwind Utilities |

---

## 📝 Implementierungs-Aufgaben

### Phase 1: Setup & Dependencies
- [x] **1.1** Tailwind CSS Integration vorbereiten (Build-Version mit Vite) ✅
- [x] **1.2** Material Icons Round einbinden ✅
- [x] **1.3** Google Fonts (Inter, JetBrains Mono) laden ✅
- [x] **1.4** Neue Farbpalette in CSS Variables/Tailwind Config definieren ✅

### Phase 2: Layout-Umbau
- [ ] **2.1** HTML-Struktur auf Tailwind-Klassen umstellen
- [ ] **2.2** Zwei-Spalten-Layout (5/12 + 7/12) implementieren
- [ ] **2.3** Header-Bar mit Icon-Buttons erstellen
- [ ] **2.4** Editor-Panel mit Zeilennummern-Sidebar
- [ ] **2.5** Timeline-Panel mit verbessertem Scrolling

### Phase 3: Editor-Verbesserungen
- [ ] **3.1** Contenteditable für Syntax-Highlighting vorbereiten
- [ ] **3.2** Syntax-Highlighting für Keywords implementieren (date:, class:, etc.)
- [ ] **3.3** Syntax-Highlighting für Markdown-Headers (##)
- [ ] **3.4** Syntax-Highlighting für Strings und Dates
- [ ] **3.5** Zeilennummern-System integrieren
- [ ] **3.6** Custom Scrollbar-Styles anpassen

### Phase 4: Timeline-Visualisierung
- [ ] **4.1** Neue Card-Styles (rounded-xl, gradient overlays)
- [ ] **4.2** Glow-Effekte für verschiedene Event-Typen
- [ ] **4.3** Hover-Animationen für Timeline-Items
- [ ] **4.4** Verbesserte Date-Badges (rounded pills)
- [ ] **4.5** Duration-Badges für Zeitspannen
- [ ] **4.6** Timeline-Linie (dashed) modernisieren
- [ ] **4.7** Dots mit Scale-Animation bei Hover

### Phase 5: Dark Mode
- [ ] **5.1** Dark Mode Toggle-Button mit Material Icon
- [ ] **5.2** Dark Mode Classes für alle Elemente
- [ ] **5.3** Smooth Transitions zwischen Themes
- [ ] **5.4** Dark Mode State in LocalStorage speichern
- [ ] **5.5** System-Präferenz berücksichtigen (prefers-color-scheme)

### Phase 6: Buttons & Controls
- [ ] **6.1** Icon-Buttons für Toolbar (New, Save, Theme, Help, Bug)
- [ ] **6.2** Primär-Button "Präsentation öffnen" mit Icon
- [ ] **6.3** Export-Buttons (Markdown, HTML, PNG, PDF) neu stylen
- [ ] **6.4** Search-Input mit Icon verbessern
- [ ] **6.5** Filter-Button modernisieren

### Phase 7: TypeScript-Integration
- [ ] **7.1** Syntax-Highlighting-Logic in TypeScript portieren
- [ ] **7.2** ContentEditable-Handler implementieren
- [ ] **7.3** Theme-Toggle-Logic integrieren
- [ ] **7.4** Editor-State-Management anpassen

### Phase 8: Responsive & Polish
- [ ] **8.1** Mobile Responsiveness testen
- [ ] **8.2** Accessibility (ARIA-Labels, Focus-States)
- [ ] **8.3** Animationen & Transitions finalisieren
- [ ] **8.4** Performance-Optimierungen
- [ ] **8.5** Cross-Browser-Tests

### Phase 9: Migration & Testing
- [ ] **9.1** Alte CSS-Dateien archivieren
- [ ] **9.2** Funktionale Tests (alle Features funktionieren)
- [ ] **9.3** Visuelle Regressionstests
- [ ] **9.4** LocalStorage-Kompatibilität prüfen
- [ ] **9.5** Export-Funktionen testen (HTML, PNG, PDF)

### Phase 10: Dokumentation
- [ ] **10.1** Changelog für v3.0 (Redesign) aktualisieren
- [ ] **10.2** Screenshots für help.md aktualisieren
- [ ] **10.3** README mit neuen Features updaten
- [ ] **10.4** CSS-Architektur dokumentieren

---

## 🔧 Technische Entscheidungen

### Tailwind CSS: CDN vs. Build
**Empfehlung:** Build-Version (mit Vite)
- ✅ Kleinere Bundle-Größe (nur genutzte Classes)
- ✅ Custom Config möglich
- ✅ Bessere Performance
- ❌ Benötigt Build-Step

### Syntax-Highlighting: Library vs. Custom
**Empfehlung:** Custom Implementation
- ✅ Leichtgewichtig
- ✅ Nur benötigte Token-Types
- ✅ Keine externe Dependency
- ❌ Mehr Entwicklungsaufwand

### Editor: Textarea vs. ContentEditable
**Empfehlung:** Hybrid-Ansatz
- Backend: Weiterhin Textarea (für Wert-Handling)
- Frontend: ContentEditable-Overlay für Syntax-Highlighting
- Sync zwischen beiden bei Änderungen

---

## ⚠️ Risiken & Herausforderungen

1. **ContentEditable-Komplexität**
   - Cursor-Position beibehalten
   - Copy/Paste-Handling
   - Undo/Redo-Kompatibilität

2. **Performance bei großen Timelines**
   - Syntax-Highlighting kann bei >1000 Zeilen langsam werden
   - Virtualisierung erwägen

3. **Breaking Changes**
   - Altes CSS komplett ersetzen
   - HTML-Struktur ändert sich drastisch
   - Mögliche Inkompatibilitäten mit bestehenden Features

4. **Browser-Kompatibilität**
   - ContentEditable verhält sich unterschiedlich
   - Tailwind benötigt moderne Browser
   - Material Icons benötigen Web-Fonts

---

## 📊 Geschätzter Aufwand

| Phase | Aufgaben | Geschätzte Zeit |
|-------|----------|-----------------|
| Phase 1 | 4 | 2 Stunden |
| Phase 2 | 5 | 4 Stunden |
| Phase 3 | 6 | 6 Stunden |
| Phase 4 | 7 | 5 Stunden |
| Phase 5 | 5 | 3 Stunden |
| Phase 6 | 5 | 3 Stunden |
| Phase 7 | 4 | 4 Stunden |
| Phase 8 | 5 | 4 Stunden |
| Phase 9 | 5 | 3 Stunden |
| Phase 10 | 4 | 2 Stunden |
| **Total** | **50 Aufgaben** | **36 Stunden** |

---

## 🎯 Meilensteine

1. **M1: Setup Complete** (Phase 1) - Alle Dependencies eingebunden
2. **M2: Layout Rebuilt** (Phase 2) - Neue Struktur steht
3. **M3: Editor Enhanced** (Phase 3) - Syntax-Highlighting funktioniert
4. **M4: Timeline Modernized** (Phase 4) - Neue Cards implementiert
5. **M5: Dark Mode Ready** (Phase 5) - Theme-Toggle funktioniert
6. **M6: Controls Updated** (Phase 6) - Alle Buttons neu gestylt
7. **M7: Full Integration** (Phase 7) - TypeScript integriert
8. **M8: Production Ready** (Phase 8-9) - Getestet und optimiert
9. **M9: Documented** (Phase 10) - Vollständig dokumentiert

---

## 🚀 Nächste Schritte

1. **Review dieses Plans** - Feedback einholen und anpassen
2. **Phase 1 starten** - Tailwind CSS und Dependencies einbinden
3. **Prototype erstellen** - Erste Version testen
4. **Iterativ arbeiten** - Phase für Phase umsetzen

---

## 📝 Notizen

- Backup des aktuellen Designs vor Start erstellen
- Feature-Branch für Redesign anlegen
- Regelmäßig committen (nach jeder abgeschlossenen Phase)
- Screenshots für Vorher/Nachher-Vergleich machen
