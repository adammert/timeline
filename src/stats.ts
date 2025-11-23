/**
 * Statistics Module
 */

import { VALID_EVENT_CLASSES } from './config';
import type { EventType } from './types';

interface EventStats {
  total: number;
  upcoming: number;
  past: number;
  duration: number;
  byClass: Record<EventType | 'none', number>;
}

interface RawEvent {
  date: Date;
  endDate?: Date | null;
  eventClass?: string | null;
}

export class Stats {
  private currentStats: EventStats = {
    total: 0,
    upcoming: 0,
    past: 0,
    duration: 0,
    byClass: {
      critical: 0,
      warning: 0,
      success: 0,
      meeting: 0,
      work: 0,
      info: 0,
      none: 0,
    },
  };

  /**
   * Calculate statistics from events
   */
  calculate(events: RawEvent[]): EventStats {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.currentStats = {
      total: events.length,
      upcoming: 0,
      past: 0,
      duration: 0,
      byClass: {
        critical: 0,
        warning: 0,
        success: 0,
        meeting: 0,
        work: 0,
        info: 0,
        none: 0,
      },
    };

    events.forEach((event) => {
      if (event.date.getTime() === new Date(0).getTime()) return;

      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);

      if (eventDate >= today) {
        this.currentStats.upcoming++;
      } else {
        this.currentStats.past++;
      }

      if (event.endDate) {
        this.currentStats.duration++;
      }

      let className: EventType | 'none' = 'none';
      if (event.eventClass) {
        const match = event.eventClass.match(/is-(\w+)/);
        if (match && match[1]) {
          className = match[1] as EventType | 'none';
        }
      }
      if (this.currentStats.byClass[className] !== undefined) {
        this.currentStats.byClass[className]++;
      }
    });

    return this.currentStats;
  }

  /**
   * Render statistics in modal
   */
  render(): void {
    const totalEl = document.getElementById('totalEvents');
    const upcomingEl = document.getElementById('upcomingEvents');
    const pastEl = document.getElementById('pastEvents');
    const durationEl = document.getElementById('durationEvents');
    const distributionContainer = document.getElementById('classDistribution');

    if (totalEl) totalEl.textContent = String(this.currentStats.total);
    if (upcomingEl) upcomingEl.textContent = String(this.currentStats.upcoming);
    if (pastEl) pastEl.textContent = String(this.currentStats.past);
    if (durationEl) durationEl.textContent = String(this.currentStats.duration);

    if (!distributionContainer) return;
    distributionContainer.innerHTML = '';

    const classColors: Record<string, string> = {
      critical: '#d32f2f',
      warning: '#ef6c00',
      success: '#2e7d32',
      meeting: '#6a1b9a',
      work: '#1565c0',
      info: '#0288d1',
      none: '#6c757d',
    };

    const classLabels: Record<string, string> = {
      critical: 'Critical',
      warning: 'Warning',
      success: 'Success',
      meeting: 'Meeting',
      work: 'Work',
      info: 'Info',
      none: 'Keine',
    };

    const totalValid = Object.values(this.currentStats.byClass).reduce((a, b) => a + b, 0);

    Object.keys(this.currentStats.byClass).forEach((className) => {
      const count = this.currentStats.byClass[className as EventType | 'none'] || 0;
      if (count === 0) return;

      const percentage = totalValid > 0 ? (count / totalValid) * 100 : 0;

      const barDiv = document.createElement('div');
      barDiv.className = 'class-bar';
      barDiv.innerHTML = `
        <div class="class-label">${classLabels[className] || className}</div>
        <div class="class-bar-bg">
          <div class="class-bar-fill" style="width: ${percentage}%; background-color: ${
        classColors[className] || '#6c757d'
      }">
            ${count} (${Math.round(percentage)}%)
          </div>
        </div>
      `;
      distributionContainer.appendChild(barDiv);
    });
  }

  /**
   * Get current statistics
   */
  getStats(): EventStats {
    return this.currentStats;
  }
}
