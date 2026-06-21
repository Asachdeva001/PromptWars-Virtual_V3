/**
 * Natural Language Processing (NLP) Parser for GreenPulse AI
 * Converts free-text user statements into structured actions and query intents.
 */

import { calculateTravel, calculateEnergy, calculateDiet, calculateShopping, FACTORS } from './engine.js';

/**
 * Parses free-text input and returns a structured intent action.
 * @param {string} text - Raw user input
 * @returns {Object} Structured intent payload
 */
export function parseNaturalLanguage(text) {
  if (!text || typeof text !== 'string') {
    return {
      intent: 'unknown',
      message: "I didn't receive any text. How can I help you track your footprint?"
    };
  }

  const cleanText = text.toLowerCase().trim();

  // 1. HELP & INFO INTENTS
  if (/^\/?(?:help|options|commands|what can i do|menu)/.test(cleanText)) {
    return {
      intent: 'help',
      message: "You can track your carbon footprint by chatting naturally. Try saying:\n" +
               "• 'I drove 15 miles in my EV'\n" +
               "• 'I ate a serving of beef burger for lunch'\n" +
               "• 'My electricity bill was 200 kWh this month'\n" +
               "• 'I spent $50 on clothes today'"
    };
  }

  // 2. QUERY STATE / STATS INTENTS
  if (/(?:what is|show|check|view)\s+(?:my\s+)?(?:carbon\s+)?(?:score|streak|points|footprint|dashboard|stats|progress)/.test(cleanText) ||
      /^(?:score|streak|points|dashboard|stats)$/.test(cleanText)) {
    return {
      intent: 'query',
      queryType: cleanText.includes('streak') ? 'streak' : 
                 cleanText.includes('point') ? 'points' : 
                 cleanText.includes('challenge') ? 'challenges' : 'dashboard',
      message: "Fetching your stats from the database..."
    };
  }

  // 3. LOGGING INTENTS

  // TRAVEL LOG PARSING
  // Match distance: numbers followed by miles, mi, km, kilometers, meters
  const travelKeywords = /(?:drove|drive|flew|fly|flight|rode|ride|travelled|travel|commute|walked|walk|cycled|cycle|run|ran|took)/;
  if (travelKeywords.test(cleanText)) {
    const distanceMatch = cleanText.match(/(\d+(?:\.\d+)?)\s*(?:miles?|mi|km|kilometers?|meters?)/);
    if (distanceMatch) {
      const val = parseFloat(distanceMatch[1]);
      let unit = distanceMatch[0].includes('mi') || distanceMatch[0].includes('mile') ? 'mi' : 'km';
      if (distanceMatch[0].includes('meter') && !distanceMatch[0].includes('kilo')) {
        unit = 'km'; // Convert meters to km
      }
      
      // Determine mode
      let mode = 'car-petrol'; // default car mode
      if (/(?:electric car|ev|electric vehicle|tesla)/.test(cleanText)) {
        mode = 'car-electric';
      } else if (/(?:hybrid car|hybrid|prius)/.test(cleanText)) {
        mode = 'car-hybrid';
      } else if (/(?:diesel)/.test(cleanText)) {
        mode = 'car-diesel';
      } else if (/(?:motorcycle|motorbike|scooter|moto)/.test(cleanText)) {
        mode = 'motorcycle';
      } else if (/(?:bus|shuttle|coach)/.test(cleanText)) {
        mode = 'bus';
      } else if (/(?:train|subway|metro|tube|rail)/.test(cleanText)) {
        mode = 'train';
      } else if (/(?:flight|flew|fly|plane|airplane)/.test(cleanText)) {
        // If long flight, classify as flight-intl, otherwise domestic
        const kmDistance = unit === 'mi' ? val * 1.60934 : val;
        mode = kmDistance > 600 ? 'flight-intl' : 'flight-domestic';
      } else if (/(?:walk|walked|run|ran|bike|bicycle|cycling|cycle|foot)/.test(cleanText)) {
        mode = 'walk-bike';
      }

      const carbon = calculateTravel(mode, val, unit);
      const friendlyMode = mode.replace('-', ' ');
      return {
        intent: 'log',
        category: 'travel',
        subcategory: mode,
        rawValue: val,
        unit,
        carbon,
        message: `Parsed a travel log: ${val} ${unit} via ${friendlyMode}. This adds **${carbon} kg CO2e** to your footprint.`
      };
    }
  }

  // ENERGY LOG PARSING
  // Match values: kwh, kilowatt-hours, liters, gallons, therms
  const energyKeywords = /(?:electricity|electric|power|grid|heating|gas|oil|utility|bill)/;
  if (energyKeywords.test(cleanText)) {
    const energyMatch = cleanText.match(/(\d+(?:\.\d+)?)\s*(?:kwh|kilowatt\s*hours?|liters?|gallons?)/);
    if (energyMatch) {
      const val = parseFloat(energyMatch[1]);
      const matchedUnit = energyMatch[0];
      let unit = 'kwh';
      let type = 'electricity-grid'; // default

      if (matchedUnit.includes('liter')) {
        unit = 'liters';
        type = 'oil-heating';
      } else if (matchedUnit.includes('gallon')) {
        unit = 'gallons';
        type = 'oil-heating';
      } else if (/(?:green|solar|wind|clean|renewable)/.test(cleanText)) {
        type = 'electricity-green';
      } else if (/(?:gas|natural gas|heating gas)/.test(cleanText)) {
        type = 'gas-heating';
      } else if (/(?:oil|heating oil)/.test(cleanText)) {
        type = 'oil-heating';
      }

      const carbon = calculateEnergy(type, val, unit);
      const friendlyType = type.replace('-', ' ');
      return {
        intent: 'log',
        category: 'energy',
        subcategory: type,
        rawValue: val,
        unit,
        carbon,
        message: `Parsed an energy log: ${val} ${unit} of ${friendlyType}. This adds **${carbon} kg CO2e** to your footprint.`
      };
    }
  }

  // DIET LOG PARSING
  // Match food servings/meals
  const dietKeywords = /(?:ate|eat|eating|had|lunch|dinner|breakfast|meal|food|diet)/;
  if (dietKeywords.test(cleanText)) {
    // Extract quantity (default to 1 if no quantity is explicit)
    const quantityMatch = cleanText.match(/(\d+(?:\.\d+)?)\s*(?:servings?|meals?|portions?|burgers?|steaks?|plates?)?/);
    let servings = 1;
    if (quantityMatch && quantityMatch[1] && !isNaN(parseFloat(quantityMatch[1]))) {
      // Make sure we didn't just extract some other number (like time or date)
      // Check if the number is close to a diet keyword or food item
      const numIndex = cleanText.indexOf(quantityMatch[1]);
      if (numIndex !== -1 && numIndex < cleanText.length / 2 + 10) {
        servings = parseFloat(quantityMatch[1]);
      }
    }

    let type = 'other-diet';
    if (/(?:beef|lamb|steak|mutton|hamburger|red meat)/.test(cleanText) && !cleanText.includes('plant-based') && !cleanText.includes('vegan')) {
      type = 'beef-lamb';
    } else if (/(?:pork|chicken|poultry|turkey|bacon)/.test(cleanText)) {
      type = 'pork-poultry';
    } else if (/(?:fish|seafood|shrimp|salmon|tuna)/.test(cleanText)) {
      type = 'fish-seafood';
    } else if (/(?:dairy|cheese|milk|butter|yogurt)/.test(cleanText)) {
      type = 'dairy-cheese';
    } else if (/(?:vegan|plant-based|plant based)/.test(cleanText)) {
      type = 'vegan';
    } else if (/(?:vegetarian|veggie)/.test(cleanText)) {
      type = 'vegetarian';
    }

    const carbon = calculateDiet(type, servings);
    const friendlyType = type.replace('-', ' ');
    return {
      intent: 'log',
      category: 'diet',
      subcategory: type,
      rawValue: servings,
      unit: servings === 1 ? 'serving' : 'servings',
      carbon,
      message: `Parsed a diet log: ${servings} serving(s) of ${friendlyType}. This adds **${carbon} kg CO2e** to your footprint.`
    };
  }

  // SHOPPING LOG PARSING
  // Match cost/dollar amount
  const shoppingKeywords = /(?:bought|buy|purchased|purchase|spent|cost|acquired)/;
  if (shoppingKeywords.test(cleanText)) {
    const moneyMatch = cleanText.match(/(?:\$\s*(\d+(?:\.\d+)?))|(\d+(?:\.\d+)?)\s*(?:dollars?|usd)/);
    if (moneyMatch) {
      const spend = parseFloat(moneyMatch[1] || moneyMatch[2]);
      let category = 'other-goods';

      if (/(?:electronics?|computer|laptop|phone|tv|television|gadget|camera)/.test(cleanText)) {
        category = 'electronics';
      } else if (/(?:clothing|clothes|shirt|pants|jacket|shoes|dress|apparel)/.test(cleanText)) {
        category = 'clothing';
      } else if (/(?:furniture|chair|table|sofa|bed|desk)/.test(cleanText)) {
        category = 'furniture';
      } else if (/(?:service|subscription|streaming|software)/.test(cleanText)) {
        category = 'services';
      }

      const carbon = calculateShopping(category, spend);
      const friendlyCategory = category.replace('-', ' ');
      return {
        intent: 'log',
        category: 'shopping',
        subcategory: category,
        rawValue: spend,
        unit: 'USD',
        carbon,
        message: `Parsed a shopping log: $${spend} spent on ${friendlyCategory}. This adds **${carbon} kg CO2e** to your footprint.`
      };
    }
  }

  // Default fallback if keywords are detected but no values are extracted
  if (travelKeywords.test(cleanText) || energyKeywords.test(cleanText) || dietKeywords.test(cleanText) || shoppingKeywords.test(cleanText)) {
    return {
      intent: 'unknown',
      message: "I recognize you are trying to track something, but I couldn't extract the value (e.g. miles, kWh, servings, or dollar amount). Please try again with details like: 'drove 10 miles' or 'spent $40 on clothes'."
    };
  }

  return {
    intent: 'unknown',
    message: "I'm not sure how to parse that. You can log travel, energy, diet, or shopping. Type 'help' to see example commands."
  };
}
