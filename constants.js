/**
 * Application-wide constants for GreenPulse AI.
 * Centralises magic numbers, scoring thresholds, and game parameters
 * to ensure a single source of truth across all modules.
 */

// ---------------------------------------------------------------------------
// Gamification Points
// ---------------------------------------------------------------------------

/** Base eco points awarded for any first log of the day */
export const POINTS_BASE_LOG = 10;

/** Bonus eco points awarded immediately when a chat assistant log is confirmed */
export const POINTS_CHAT_LOG = 5;

/** Bonus eco points awarded for logging a green eco-swap product alternative */
export const POINTS_ECO_SWAP = 15;

/** Streak bonus multiplier: streakDays * POINTS_STREAK_MULTIPLIER, capped at POINTS_STREAK_MAX */
export const POINTS_STREAK_MULTIPLIER = 5;

/** Maximum streak bonus points per log event */
export const POINTS_STREAK_MAX = 50;

// ---------------------------------------------------------------------------
// Carbon Score Gauge
// ---------------------------------------------------------------------------

/**
 * Circumference (px) of the SVG radial gauge circle.
 * Derived from: 2 × π × r = 2 × 3.14159 × 90 ≈ 565.48
 */
export const GAUGE_CIRCUMFERENCE = 565.48;

/** Gauge fill percentage above which the stroke changes to warning amber */
export const GAUGE_WARN_PCT = 75;

/** Gauge fill percentage above which the stroke changes to danger red */
export const GAUGE_DANGER_PCT = 90;

// ---------------------------------------------------------------------------
// Carbon Goal Defaults
// ---------------------------------------------------------------------------

/** Default annual carbon budget target in kg CO2e */
export const DEFAULT_CARBON_GOAL = 3000;

// ---------------------------------------------------------------------------
// Scanner Animation Timings (ms)
// ---------------------------------------------------------------------------

/** Delay before scanner transitions from "Aligning…" to "Decoding…" stage */
export const SCANNER_ALIGN_DELAY_MS = 450;

/** Delay before scanner transitions from "Decoding…" to "Scan Success!" stage */
export const SCANNER_DECODE_DELAY_MS = 500;

// ---------------------------------------------------------------------------
// State / Persistence
// ---------------------------------------------------------------------------

/** localStorage key used to persist GreenPulse application state */
export const STORAGE_KEY = 'greenpulse_state';

// ---------------------------------------------------------------------------
// Streak Thresholds for UI badges
// ---------------------------------------------------------------------------

/** Minimum streak length (days) to activate the animated streak-active indicator */
export const STREAK_ACTIVE_MIN = 1;
