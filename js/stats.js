/**
 * Statistics Module
 */

TimelineApp.Stats = {
  currentStats: {
    total: 0,
    upcoming: 0,
    past: 0,
    duration: 0,
    byClass: {}
  },

  /**
   * Calculate statistics from events
   */
  calculate(events) {
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
        none: 0
      }
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

      let className = "none";
      if (event.eventClass) {
        const match = event.eventClass.match(/is-(\w+)/);
        if (match) className = match[1];
      }
      this.currentStats.byClass[className]++;
    });

    return this.currentStats;
  },

  /**
   * Render statistics in modal
   */
  render() {
    document.getElementById("totalEvents").textContent = this.currentStats.total;
    document.getElementById("upcomingEvents").textContent = this.currentStats.upcoming;
    document.getElementById("pastEvents").textContent = this.currentStats.past;
    document.getElementById("durationEvents").textContent = this.currentStats.duration;

    const distributionContainer = document.getElementById("classDistribution");
    distributionContainer.innerHTML = "";

    const classColors = {
      critical: "#d32f2f",
      warning: "#ef6c00",
      success: "#2e7d32",
      meeting: "#6a1b9a",
      work: "#1565c0",
      none: "#6c757d"
    };

    const classLabels = {
      critical: "Critical",
      warning: "Warning",
      success: "Success",
      meeting: "Meeting",
      work: "Work",
      none: "Keine"
    };

    const totalValid = Object.values(this.currentStats.byClass).reduce(
      (a, b) => a + b,
      0
    );

    Object.keys(this.currentStats.byClass).forEach((className) => {
      const count = this.currentStats.byClass[className];
      if (count === 0) return;

      const percentage = totalValid > 0 ? (count / totalValid) * 100 : 0;

      const barDiv = document.createElement("div");
      barDiv.className = "class-bar";
      barDiv.innerHTML = `
        <div class="class-label">${classLabels[className]}</div>
        <div class="class-bar-bg">
          <div class="class-bar-fill" style="width: ${percentage}%; background-color: ${
        classColors[className]
      }">
            ${count} (${Math.round(percentage)}%)
          </div>
        </div>
      `;
      distributionContainer.appendChild(barDiv);
    });
  },

  /**
   * Get current statistics
   */
  getStats() {
    return this.currentStats;
  }
};
