/**
 * Main Entry Point for Timeline Visualizer
 */

import './styles/tailwind.css';
import './styles/styles.css';
import { TimelineApp } from './app';

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('Timeline Visualizer v2.0 - TypeScript Edition');

  const app = new TimelineApp();
  app.init();

  // Expose to window for debugging (optional)
  if (import.meta.env.DEV) {
    (window as any).TimelineApp = app;
  }
});
