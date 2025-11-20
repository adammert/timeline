**Kontext:**
Wir arbeiten an dem Projekt "Timeline Visualizer" (eine lokale HTML/JS App ohne Backend). Die Architektur besteht aus getrennten Modulen (`parser.js`, `renderer.js`, `storage.js`, etc.).

**Ziel:**
Wir wollen zwei neue Hauptfeatures implementieren:

1. **Scroll-Animationen:** Events sollen beim Scrollen sanft eingeblendet werden.
2. **Swimlanes (Gruppierung):** Unterstützung für parallele Zeitstränge (Subprozesse), basierend auf einer neuen `group:` Eigenschaft im Markdown.

Bitte führe die folgenden Änderungen schrittweise durch.

---

## Phase 1: Scroll-Animationen (Visual Polish)

Das Ziel ist, dass Timeline-Items nicht starr erscheinen, sondern beim Scrollen "hereinfliegen".

### 1. CSS Updates (`css/styles.css`)

Füge Klassen für die Animation hinzu:

- Erstelle `.timeline-item` Styles für den Startzustand: `opacity: 0`, `transform: translateY(20px)`, `transition: all 0.6s cubic-bezier(...)`.
- Erstelle eine Klasse `.timeline-item.is-visible` für den Endzustand: `opacity: 1`, `transform: translateY(0)`.
- Deaktiviere Animationen, wenn der User "reduzierte Bewegung" bevorzugt (`@media (prefers-reduced-motion)`).

### 2. Renderer Updates (`js/renderer.js`)

Erweitere die Funktion `renderTimeline`:

- Instanziiere am Ende der Rendering-Logik einen `IntersectionObserver`.
- Der Observer soll alle `.timeline-item` Elemente beobachten.
- Wenn ein Element `isIntersecting` ist, füge die Klasse `.is-visible` hinzu und beende das Observing (`unobserve`) für dieses Element, damit es nicht flackert.
- Setze einen `threshold` von ca. 0.1.

---

## Phase 2: Swimlanes / Branching (Logik & Layout)

Das Ziel ist, Events visuell in Spalten (Lanes) aufzuteilen, wenn im Markdown eine Gruppe definiert ist.
_Beispiel Syntax:_ `group: Frontend` oder `group: Backend`.

### 1. Parser erweitern (`js/parser.js`)

Modifiziere `parseEvents` und die Regex-Logik:

- Suche nach einer neuen Zeile: `group: [Name]` oder `lane: [Name]`.
- Speichere diesen Wert im Event-Objekt unter `event.group`.
- Wenn kein `group` angegeben ist, setze `event.group = 'Default'` (oder null).

### 2. CSS für Swimlanes (`css/styles.css`)

Wir benötigen ein Grid-System für die Timeline, wenn der Swimlane-Modus aktiv ist.

- Erstelle eine Klasse `.timeline.is-swimlanes`.
- In diesem Modus soll der Container ein CSS Grid sein: `display: grid`.
- Die Spaltenanzahl richtet sich nach den gefundenen Gruppen.
- Styles für `.timeline-lane-header` (Spaltenüberschriften).
- Anpassung der `.timeline-item` Positionierung innerhalb der Spalten (vielleicht `grid-column` basierend auf Index).
- _Wichtig:_ Die chronologische Sortierung (vertikal) muss erhalten bleiben.

### 3. Renderer erweitern (`js/renderer.js`)

Hier liegt die Hauptlogik:

- **Gruppen extrahieren:** Ermittle vor dem Rendern alle einzigartigen `group`-Werte aus den Events.
- **Modus entscheiden:**
  - Wenn nur 1 Gruppe (oder keine) existiert: Render wie bisher (Lineare Ansicht).
  - Wenn > 1 Gruppe existiert: Aktiviere Swimlane-Modus.
- **Swimlane-Rendering:**
  - Erstelle Header für jede Gruppe oben.
  - Anstatt einer einfachen Liste, erstelle einen Grid-Container.
  - Weise jedem Event basierend auf seiner `group` die korrekte CSS-Grid-Spalte zu (via Inline-Style `--col-index: X` oder ähnlichem).
  - _Visuelle Verbindung:_ Versuche, Dauer-Events (`end_date`) korrekt innerhalb ihrer Spalte darzustellen.

### 4. UI Toggle (`index.html` & `js/app.js`)

- Füge im Header (neben dem Theme-Toggle) einen neuen Button hinzu: `id="viewToggle"`. Icon: 🛤️ (für Lanes) vs 📜 (für Liste).
- In `app.js`: Wenn dieser Button geklickt wird, toggle eine Klasse am `timelineOutput` Container oder triggere ein Re-Render mit einem Flag `useSwimlanes`.
- Speichere die Präferenz im `localStorage` (`js/storage.js`).

---

**Zusammenfassung der Aufgaben für die CLI:**

1. `css/styles.css` für Animationen und Grid-Layout anpassen.
2. `js/parser.js` anpassen, um `group:` zu lesen.
3. `js/renderer.js` umschreiben, um `IntersectionObserver` hinzuzufügen und dynamisch zwischen Listen- und Grid-Ansicht (Swimlanes) zu wechseln.
4. `index.html` und `app.js` anpassen, um den View-Toggle Button einzubauen.

Bitte beginne mit Phase 1 (Animationen) und gehe dann zu Phase 2 (Swimlanes) über.
