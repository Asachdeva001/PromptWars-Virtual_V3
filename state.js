/**
 * Central State Store for GreenPulse AI
 * Uses a PubSub model for dynamic SPA rendering.
 * Operates in memory and syncs to localStorage when available.
 */

// Mock localStorage for Node.js test environment
const mockStorage = {
  store: {},
  getItem(key) {
    return this.store[key] || null;
  },
  setItem(key, value) {
    this.store[key] = String(value);
  },
  clear() {
    this.store = {};
  }
};

const storage = typeof window !== 'undefined' && window.localStorage ? window.localStorage : mockStorage;

// Set up GCP Cloud Function URL mapping
const API_URL = typeof window !== 'undefined' 
  ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:8080' 
      : 'https://us-central1-virtuprompt.cloudfunctions.net/api')
  : null;

const DEFAULT_STATE = {
  profile: {
    name: 'Eco Citizen',
    carbonGoal: 3000, // Target kg CO2e per year limit
    region: 'Global Average'
  },
  logs: [], // Array of log objects: { id, timestamp, date, category, subcategory, rawValue, carbon, notes }
  streak: {
    current: 0,
    lastLoggedDate: null // YYYY-MM-DD
  },
  points: 0, // Green points earned from challenges
  activeChallenges: [], // Array of challenge IDs currently active
  completedChallenges: [], // Array of objects: { id, dateCompleted }
  claimedRewards: [] // Array of objects: { id, dateClaimed, code }
};

class StateStore {
  constructor() {
    this.listeners = new Set();
    this.load();
    this.syncWithGCP();
  }

  /**
   * Asynchronously sync logs with GCP Firestore backend
   */
  async syncWithGCP() {
    if (!API_URL) return;
    try {
      const response = await fetch(`${API_URL}/logs`);
      const data = await response.json();
      if (data && data.success && data.logs) {
        this.state.logs = data.logs;
        this.save();
      }
    } catch (err) {
      console.log("GCP Firestore API offline/unconfigured, running in LocalStorage database fallback mode.");
    }
  }

  /**
   * Retrieves the current application state.
   * @returns {Object} Deep copy of current state
   */
  getState() {
    return JSON.parse(JSON.stringify(this.state));
  }

  /**
   * Registers a subscriber callback that fires on state updates.
   * @param {Function} listener - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe(listener) {
    this.listeners.add(listener);
    // Return unsubscribe function
    return () => this.listeners.delete(listener);
  }

  /**
   * Triggers all subscribed listeners.
   */
  notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.getState());
      } catch (err) {
        console.error('Error in state subscriber:', err);
      }
    }
  }

  /**
   * Persists state to local storage and alerts subscribers.
   */
  save() {
    try {
      storage.setItem('greenpulse_state', JSON.stringify(this.state));
    } catch (err) {
      console.error('Failed to save state to localStorage:', err);
    }
    this.notify();
  }

  /**
   * Loads state from local storage or sets default values.
   */
  load() {
    try {
      const data = storage.getItem('greenpulse_state');
      if (data) {
        this.state = JSON.parse(data);
      } else {
        this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
      }
    } catch (err) {
      console.error('Failed to load state from localStorage:', err);
      this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    }
  }

  /**
   * Resets the store state to defaults.
   */
  reset() {
    this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    this.save();
  }

  /**
   * Adds an emission log and updates the streak.
   * @param {Object} logData - { category, subcategory, rawValue, carbon, notes }
   * @returns {Object} Newly created log entry
   */
  addLog({ category, subcategory, rawValue, carbon, notes = '' }) {
    const today = new Date().toISOString().split('T')[0];
    const tempId = 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    const log = {
      id: tempId,
      timestamp: Date.now(),
      date: today,
      category,
      subcategory,
      rawValue: Number(rawValue),
      carbon: Number(carbon),
      notes: String(notes)
    };

    this.state.logs.push(log);
    this.updateStreak(today);
    this.save();

    // Async sync to GCP Firestore Cloud Function
    if (API_URL) {
      fetch(`${API_URL}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log)
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.id) {
          const index = this.state.logs.findIndex(l => l.id === tempId);
          if (index !== -1) {
            this.state.logs[index].id = data.id;
            this.save();
          }
        }
      })
      .catch(err => console.warn("Failed to sync log to Firestore:", err.message));
    }

    return log;
  }

  /**
   * Removes a log by ID.
   * @param {string} id - The log ID to delete
   */
  deleteLog(id) {
    this.state.logs = this.state.logs.filter(log => log.id !== id);
    this.save();

    // Async deletion from GCP Firestore Cloud Function
    if (API_URL) {
      fetch(`${API_URL}/logs/${id}`, {
        method: 'DELETE'
      })
      .catch(err => console.warn("Failed to delete log from Firestore:", err.message));
    }
  }

  /**
   * Updates user profile attributes.
   * @param {Object} profileUpdates - Partial profile object
   */
  updateProfile(profileUpdates) {
    this.state.profile = {
      ...this.state.profile,
      ...profileUpdates
    };
    this.save();
  }

  /**
   * Handles daily logging streak checks and increments.
   * @param {string} todayStr - Today's date string YYYY-MM-DD
   */
  updateStreak(todayStr) {
    const lastLogged = this.state.streak.lastLoggedDate;

    if (!lastLogged) {
      // First log ever
      this.state.streak.current = 1;
      this.state.streak.lastLoggedDate = todayStr;
      this.state.points += 10; // Bonus points for starting streak
    } else if (lastLogged === todayStr) {
      // Already logged today, streak does not increment but is maintained
    } else {
      // Calculate date difference
      const lastDate = new Date(lastLogged);
      const currentDate = new Date(todayStr);
      const diffTime = Math.abs(currentDate - lastDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Logged on consecutive day
        this.state.streak.current += 1;
        this.state.streak.lastLoggedDate = todayStr;
        // Award points based on streak length (10 points + 5 points streak bonus up to max 50 points)
        const streakBonus = Math.min(this.state.streak.current * 5, 50);
        this.state.points += 10 + streakBonus;
      } else {
        // Streak broken
        this.state.streak.current = 1;
        this.state.streak.lastLoggedDate = todayStr;
        this.state.points += 10;
      }
    }
  }

  /**
   * Join a community challenge.
   * @param {string|number} id - Challenge ID
   */
  joinChallenge(id) {
    if (!this.state.activeChallenges.includes(id) && 
        !this.state.completedChallenges.some(c => c.id === id)) {
      this.state.activeChallenges.push(id);
      this.save();
    }
  }

  /**
   * Completes an active challenge and awards points.
   * @param {string|number} id - Challenge ID
   * @param {number} pointsReward - Points to award
   */
  completeChallenge(id, pointsReward) {
    this.state.activeChallenges = this.state.activeChallenges.filter(cid => cid !== id);
    if (!this.state.completedChallenges.some(c => c.id === id)) {
      const today = new Date().toISOString().split('T')[0];
      this.state.completedChallenges.push({ id, dateCompleted: today });
      this.state.points += Number(pointsReward);
      this.save();
    }
  }

  /**
   * Redeems a reward if user has enough points.
   * @param {string|number} id - Reward ID
   * @param {number} pointsCost - Points cost
   * @returns {boolean} True if successful, false if insufficient points
   */
  redeemReward(id, pointsCost) {
    if (this.state.points >= pointsCost) {
      this.state.points -= pointsCost;
      const today = new Date().toISOString().split('T')[0];
      const claimCode = 'GP-' + Math.random().toString(36).substr(2, 6).toUpperCase() + '-' + Date.now().toString().slice(-4);
      
      this.state.claimedRewards.push({
        id,
        dateClaimed: today,
        code: claimCode
      });
      this.save();
      return true;
    }
    return false;
  }
}

export const store = new StateStore();
