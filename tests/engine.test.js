import test from 'node:test';
import assert from 'node:assert';
import {
  calculateTravel,
  calculateEnergy,
  calculateDiet,
  calculateShopping
} from '../engine.js';

test('Carbon Engine: Travel Calculations', () => {
  // Test basic metric distance
  assert.strictEqual(calculateTravel('car-petrol', 100, 'km'), 17.00); // 100 * 0.17
  assert.strictEqual(calculateTravel('car-electric', 100, 'km'), 5.00); // 100 * 0.05
  assert.strictEqual(calculateTravel('walk-bike', 50, 'km'), 0.00);

  // Test mile conversions
  // 10 miles = 16.0934 km. For hybrid: 16.0934 * 0.11 = 1.770274 -> 1.77
  assert.strictEqual(calculateTravel('car-hybrid', 10, 'mi'), 1.77);
  // 100 miles = 160.934 km. For flight-intl: 160.934 * 0.18 = 28.96812 -> 28.97
  assert.strictEqual(calculateTravel('flight-intl', 100, 'mi'), 28.97);

  // Test invalid input cases
  assert.strictEqual(calculateTravel('car-petrol', -10, 'km'), 0);
  assert.strictEqual(calculateTravel('car-petrol', 'invalid', 'km'), 0);
  assert.strictEqual(calculateTravel('unknown-mode', 100, 'km'), 0);
});

test('Carbon Engine: Energy Calculations', () => {
  // Grid electricity: 250 kWh * 0.38 = 95.00 kg CO2
  assert.strictEqual(calculateEnergy('electricity-grid', 250), 95.00);
  // Green electricity: 250 kWh * 0.02 = 5.00 kg CO2
  assert.strictEqual(calculateEnergy('electricity-green', 250), 5.00);
  // Gas heating: 150 kWh * 0.18 = 27.00 kg CO2
  assert.strictEqual(calculateEnergy('gas-heating', 150), 27.00);

  // Oil heating (liters vs gallons conversion)
  // 100 liters * 2.68 = 268.00 kg CO2
  assert.strictEqual(calculateEnergy('oil-heating', 100, 'liters'), 268.00);
  // 50 gallons = 50 / 0.264172 = 189.27 liters. 189.27 * 2.68 = 507.24 kg CO2
  assert.strictEqual(calculateEnergy('oil-heating', 50, 'gallons'), 507.25);

  // Test invalid inputs
  assert.strictEqual(calculateEnergy('electricity-grid', -50), 0);
  assert.strictEqual(calculateEnergy('electricity-grid', null), 0);
  assert.strictEqual(calculateEnergy('unknown-energy', 100), 0);
});

test('Carbon Engine: Diet Calculations', () => {
  // Beef: 3 servings * 7.0 = 21.0 kg CO2
  assert.strictEqual(calculateDiet('beef-lamb', 3), 21.00);
  // Vegan: 5 servings * 0.2 = 1.0 kg CO2
  assert.strictEqual(calculateDiet('vegan', 5), 1.00);
  // Dairy: 4 servings * 1.5 = 6.0 kg CO2
  assert.strictEqual(calculateDiet('dairy-cheese', 4), 6.00);

  // Test invalid inputs
  assert.strictEqual(calculateDiet('beef-lamb', -1), 0);
  assert.strictEqual(calculateDiet('vegan', undefined), 0);
  assert.strictEqual(calculateDiet('unknown-diet', 10), 0);
});

test('Carbon Engine: Shopping Calculations', () => {
  // Electronics: $500 * 0.45 = 225.00 kg CO2
  assert.strictEqual(calculateShopping('electronics', 500), 225.00);
  // Clothing: $80 * 0.35 = 28.00 kg CO2
  assert.strictEqual(calculateShopping('clothing', 80), 28.00);

  // Test invalid inputs
  assert.strictEqual(calculateShopping('clothing', -10), 0);
  assert.strictEqual(calculateShopping('clothing', 'free'), 0);
  assert.strictEqual(calculateShopping('unknown-category', 100), 0);
});
