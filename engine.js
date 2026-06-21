/**
 * Carbon Calculation Engine for GreenPulse AI
 * Provides standard EPA/Defra based greenhouse gas emission factors.
 * All outputs are returned in kg CO2e (kilograms of carbon dioxide equivalent).
 */

// Constants and conversion rates
export const CONVERSIONS = {
  MILES_TO_KM: 1.60934,
  LITERS_TO_GALLONS: 0.264172,
};

// Factors (kg CO2e per unit)
export const FACTORS = {
  travel: {
    'car-petrol': 0.17,      // per km
    'car-diesel': 0.16,      // per km
    'car-hybrid': 0.11,      // per km
    'car-electric': 0.05,    // per km (average grid mix)
    'motorcycle': 0.11,      // per km
    'bus': 0.03,             // per passenger km
    'train': 0.02,           // per passenger km
    'flight-domestic': 0.25, // per passenger km (radiative forcing included)
    'flight-intl': 0.18,     // per passenger km
    'walk-bike': 0.00        // zero-emission transportation
  },
  energy: {
    'electricity-grid': 0.38, // per kWh
    'electricity-green': 0.02, // per kWh (lifecycle solar/wind overhead)
    'gas-heating': 0.18,      // per kWh
    'oil-heating': 2.68       // per liter
  },
  diet: {
    'beef-lamb': 7.0,   // per serving (~100g cooked equivalent)
    'pork-poultry': 2.2, // per serving
    'fish-seafood': 1.6, // per serving
    'dairy-cheese': 1.5, // per serving
    'vegetarian': 0.5,   // per average vegetarian meal
    'vegan': 0.2,        // per average vegan meal
    'other-diet': 0.4    // generic grains/vegetables
  },
  shopping: {
    'electronics': 0.45,  // per USD spent
    'clothing': 0.35,     // per USD spent
    'furniture': 0.30,    // per USD spent
    'other-goods': 0.15,   // per USD spent
    'services': 0.05      // per USD spent
  }
};

/**
 * Calculates emissions for a travel activity.
 * @param {string} mode - Mode of travel (e.g., 'car-petrol', 'flight-intl')
 * @param {number} distance - Distance traveled
 * @param {string} [unit='km'] - Distance unit ('km' or 'mi')
 * @returns {number} kg CO2e
 */
export function calculateTravel(mode, distance, unit = 'km') {
  if (typeof distance !== 'number' || isNaN(distance) || distance < 0) {
    return 0;
  }
  const factor = FACTORS.travel[mode] || 0;
  let km = distance;
  if (unit === 'mi') {
    km = distance * CONVERSIONS.MILES_TO_KM;
  }
  return parseFloat((km * factor).toFixed(2));
}

/**
 * Calculates emissions for an energy activity.
 * @param {string} type - Energy source (e.g., 'electricity-grid', 'oil-heating')
 * @param {number} value - Quantity of energy used
 * @param {string} [unit='kwh'] - Energy unit ('kwh' or 'liters' for oil)
 * @returns {number} kg CO2e
 */
export function calculateEnergy(type, value, unit = 'kwh') {
  if (typeof value !== 'number' || isNaN(value) || value < 0) {
    return 0;
  }
  const factor = FACTORS.energy[type] || 0;
  // If oil heating is specified in gallons, convert to liters
  let quantity = value;
  if (type === 'oil-heating' && unit === 'gallons') {
    quantity = value / CONVERSIONS.LITERS_TO_GALLONS;
  }
  return parseFloat((quantity * factor).toFixed(2));
}

/**
 * Calculates emissions for a food intake.
 * @param {string} type - Food category (e.g., 'beef-lamb', 'vegan')
 * @param {number} servings - Number of servings or meals
 * @returns {number} kg CO2e
 */
export function calculateDiet(type, servings) {
  if (typeof servings !== 'number' || isNaN(servings) || servings < 0) {
    return 0;
  }
  const factor = FACTORS.diet[type] || 0;
  return parseFloat((servings * factor).toFixed(2));
}

/**
 * Calculates emissions for a shopping item/category purchase.
 * @param {string} category - Shopping category (e.g., 'electronics', 'clothing')
 * @param {number} spend - USD spent
 * @returns {number} kg CO2e
 */
export function calculateShopping(category, spend) {
  if (typeof spend !== 'number' || isNaN(spend) || spend < 0) {
    return 0;
  }
  const factor = FACTORS.shopping[category] || 0;
  return parseFloat((spend * factor).toFixed(2));
}
