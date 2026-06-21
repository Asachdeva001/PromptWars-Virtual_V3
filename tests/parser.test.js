import test from 'node:test';
import assert from 'node:assert';
import { parseNaturalLanguage } from '../parser.js';

test('NLP Parser: Help and Query Intents', () => {
  const helpResult1 = parseNaturalLanguage('help');
  assert.strictEqual(helpResult1.intent, 'help');
  assert.ok(helpResult1.message.includes('track your carbon footprint'));

  const helpResult2 = parseNaturalLanguage('what can i do?');
  assert.strictEqual(helpResult2.intent, 'help');

  const queryResult1 = parseNaturalLanguage('show my carbon score');
  assert.strictEqual(queryResult1.intent, 'query');
  assert.strictEqual(queryResult1.queryType, 'dashboard');

  const queryResult2 = parseNaturalLanguage('check my streak');
  assert.strictEqual(queryResult2.intent, 'query');
  assert.strictEqual(queryResult2.queryType, 'streak');
});

test('NLP Parser: Travel Log Inputs', () => {
  // Test EV log
  const logEV = parseNaturalLanguage('I drove 15 miles in my EV');
  assert.strictEqual(logEV.intent, 'log');
  assert.strictEqual(logEV.category, 'travel');
  assert.strictEqual(logEV.subcategory, 'car-electric');
  assert.strictEqual(logEV.rawValue, 15);
  assert.strictEqual(logEV.unit, 'mi');
  // 15 miles = 24.14 km. 24.14 * 0.05 = 1.207 -> 1.21 kg
  assert.strictEqual(logEV.carbon, 1.21);

  // Test flight log
  const logFlight = parseNaturalLanguage('log a flight of 800 miles');
  assert.strictEqual(logFlight.intent, 'log');
  assert.strictEqual(logFlight.category, 'travel');
  assert.strictEqual(logFlight.subcategory, 'flight-intl'); // >600km
  assert.strictEqual(logFlight.rawValue, 800);
  assert.strictEqual(logFlight.unit, 'mi');

  // Test walk/bike log
  const logWalk = parseNaturalLanguage('walked 5 km to the store');
  assert.strictEqual(logWalk.intent, 'log');
  assert.strictEqual(logWalk.category, 'travel');
  assert.strictEqual(logWalk.subcategory, 'walk-bike');
  assert.strictEqual(logWalk.rawValue, 5);
  assert.strictEqual(logWalk.carbon, 0);
});

test('NLP Parser: Energy Log Inputs', () => {
  // Test grid electricity
  const logGrid = parseNaturalLanguage('our electricity bill was 200 kwh this month');
  assert.strictEqual(logGrid.intent, 'log');
  assert.strictEqual(logGrid.category, 'energy');
  assert.strictEqual(logGrid.subcategory, 'electricity-grid');
  assert.strictEqual(logGrid.rawValue, 200);
  // 200 * 0.38 = 76.0
  assert.strictEqual(logGrid.carbon, 76.0);

  // Test oil heating in gallons
  const logOil = parseNaturalLanguage('we used 50 gallons of heating oil');
  assert.strictEqual(logOil.intent, 'log');
  assert.strictEqual(logOil.category, 'energy');
  assert.strictEqual(logOil.subcategory, 'oil-heating');
  assert.strictEqual(logOil.rawValue, 50);
  assert.strictEqual(logOil.unit, 'gallons');
});

test('NLP Parser: Diet Log Inputs', () => {
  // Beef servings
  const logBeef = parseNaturalLanguage('I ate 2 servings of beef today');
  assert.strictEqual(logBeef.intent, 'log');
  assert.strictEqual(logBeef.category, 'diet');
  assert.strictEqual(logBeef.subcategory, 'beef-lamb');
  assert.strictEqual(logBeef.rawValue, 2);
  // 2 * 7.0 = 14.0
  assert.strictEqual(logBeef.carbon, 14.0);

  // Vegan default servings
  const logVegan = parseNaturalLanguage('had a vegan lunch');
  assert.strictEqual(logVegan.intent, 'log');
  assert.strictEqual(logVegan.category, 'diet');
  assert.strictEqual(logVegan.subcategory, 'vegan');
  assert.strictEqual(logVegan.rawValue, 1); // defaults to 1
  assert.strictEqual(logVegan.carbon, 0.2);
});

test('NLP Parser: Shopping Log Inputs', () => {
  // Electronics spent
  const logShopping1 = parseNaturalLanguage('bought a computer for $1200');
  assert.strictEqual(logShopping1.intent, 'log');
  assert.strictEqual(logShopping1.category, 'shopping');
  assert.strictEqual(logShopping1.subcategory, 'electronics');
  assert.strictEqual(logShopping1.rawValue, 1200);
  // 1200 * 0.45 = 540.0
  assert.strictEqual(logShopping1.carbon, 540.0);

  // Clothing spent
  const logShopping2 = parseNaturalLanguage('spent 80 dollars on clothing');
  assert.strictEqual(logShopping2.intent, 'log');
  assert.strictEqual(logShopping2.category, 'shopping');
  assert.strictEqual(logShopping2.subcategory, 'clothing');
  assert.strictEqual(logShopping2.rawValue, 80);
});

test('NLP Parser: Edge cases & Fallbacks', () => {
  const resultEmpty = parseNaturalLanguage('');
  assert.strictEqual(resultEmpty.intent, 'unknown');

  // Recognizes category but lacks metric values
  const resultVague = parseNaturalLanguage('I rode my car');
  assert.strictEqual(resultVague.intent, 'unknown');
  assert.ok(resultVague.message.includes("couldn't extract the value"));

  // Completely unknown statement
  const resultGibberish = parseNaturalLanguage('hello anti gravity');
  assert.strictEqual(resultGibberish.intent, 'unknown');
  assert.ok(resultGibberish.message.includes("not sure how to parse"));
});
