/**
 * Main Application Coordinator for GreenPulse AI
 * Manages SPA routing, header state sync, and boots component controllers.
 */

import { store } from './state.js';
import { DashboardComponent } from './components/Dashboard.js';
import { TrackerComponent } from './components/Tracker.js';
import { ScannerComponent } from './components/Scanner.js';
import { GamificationComponent } from './components/Gamification.js';
import { ChatAssistantComponent } from './components/ChatAssistant.js';

class App {
  constructor() {
    this.navButtons = document.querySelectorAll('.nav-btn');
    this.viewPanels = document.querySelectorAll('.view-panel');
    
    this.streakCountEl = document.getElementById('streak-count');
    this.pointsCountEl = document.getElementById('points-count');
    this.streakPill = document.getElementById('quick-streak');
    
    this.initSPA();
    this.initStateSync();
    this.bootComponents();
    this.seedInitialData();
  }

  /**
   * Sets up SPA tab-switching view panels.
   */
  initSPA() {
    this.navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const viewName = btn.getAttribute('data-view');
        
        // Update active nav button
        this.navButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Toggle view panel visibility
        this.viewPanels.forEach(panel => {
          if (panel.id === `view-${viewName}`) {
            panel.classList.add('active');
          } else {
            panel.classList.remove('active');
          }
        });
      });
    });
  }

  /**
   * Syncs header quick-stats elements with state mutations.
   */
  initStateSync() {
    store.subscribe((state) => {
      // Sync streak
      if (this.streakCountEl) {
        this.streakCountEl.textContent = state.streak.current;
      }
      if (this.streakPill) {
        if (state.streak.current > 0) {
          this.streakPill.classList.add('streak-active');
        } else {
          this.streakPill.classList.remove('streak-active');
        }
      }

      // Sync Eco Points
      if (this.pointsCountEl) {
        this.pointsCountEl.textContent = state.points.toLocaleString();
      }
    });
  }

  /**
   * Instantiates all component view controllers.
   */
  bootComponents() {
    this.dashboard = new DashboardComponent();
    this.tracker = new TrackerComponent();
    this.scanner = new ScannerComponent();
    this.gamification = new GamificationComponent();
    this.chatAssistant = new ChatAssistantComponent();

    // Trigger initial render of state to all components
    store.save();
  }

  /**
   * Seeds visual mock data logs for first-time visitors.
   */
  seedInitialData() {
    const currentState = store.getState();
    if (currentState.logs.length === 0) {
      // Seed travel log
      store.addLog({
        category: 'travel',
        subcategory: 'car-petrol',
        rawValue: 45,
        carbon: 7.65,
        notes: 'Commute to office (45 km)'
      });

      // Seed energy log
      store.addLog({
        category: 'energy',
        subcategory: 'electricity-grid',
        rawValue: 120,
        carbon: 45.60,
        notes: 'Monthly Grid electricity bill (120 kWh)'
      });

      // Seed diet log
      store.addLog({
        category: 'diet',
        subcategory: 'beef-lamb',
        rawValue: 2,
        carbon: 14.00,
        notes: 'Ate beef steak servings (x2)'
      });

      // Seed shopping log
      store.addLog({
        category: 'shopping',
        subcategory: 'clothing',
        rawValue: 60,
        carbon: 21.00,
        notes: 'Bought shopping items ($60 spend)'
      });

      // Set initial mock points and streak
      store.state.points = 45;
      store.state.streak.current = 2;
      // yesterday date string
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      store.state.streak.lastLoggedDate = yesterday;
      
      store.save();
    }
  }
}

// Instantiate the application once the DOM content completes loading
window.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
