/**
 * Database of Challenges, Rewards, Products, and Regional Averages
 * For GreenPulse AI
 */

export const CHALLENGES = [
  {
    id: 'challenge_diet',
    title: 'Go Meat-Free Today',
    description: 'Replace meat servings with plant-based, vegan, or vegetarian choices.',
    points: 30,
    category: 'diet'
  },
  {
    id: 'challenge_energy',
    title: 'Vampire Power Shutdown',
    description: 'Unplug chargers, computers, and TVs at the wall when going to sleep.',
    points: 20,
    category: 'energy'
  },
  {
    id: 'challenge_travel',
    title: 'Active Commuting',
    description: 'Walk, bicycle, or run for a journey under 3 miles instead of using a car.',
    points: 40,
    category: 'travel'
  },
  {
    id: 'challenge_shopping',
    title: 'Zero Waste Shopping Day',
    description: 'Avoid single-use plastic packaging and purchase only necessary eco-certified goods.',
    points: 30,
    category: 'shopping'
  },
  {
    id: 'challenge_public_transit',
    title: 'Transit Rider',
    description: 'Take public transit (bus or train) instead of driving a personal vehicle today.',
    points: 25,
    category: 'travel'
  }
];

export const REWARDS = [
  {
    id: 'reward_tree',
    title: 'Plant a Native Tree',
    description: 'We partner with Eden Reforestation Projects to plant a real tree in your name.',
    pointsCost: 100,
    sponsor: 'Eden Reforestation'
  },
  {
    id: 'reward_mug',
    title: '25% Off Reusable Coffee Mug',
    description: 'Get a discount code for an insulated stainless steel travel coffee flask.',
    pointsCost: 150,
    sponsor: 'EcoVessel'
  },
  {
    id: 'reward_tote',
    title: 'Free Organic Cotton Canvas Bag',
    description: 'Claim a high-durability, reusable grocery shopping canvas tote.',
    pointsCost: 200,
    sponsor: 'Baggu'
  },
  {
    id: 'reward_offset',
    title: 'Offset 500kg CO2e',
    description: 'Fund certified clean wind energy development projects in developing regions.',
    pointsCost: 350,
    sponsor: 'Gold Standard Offsets'
  }
];

export const PRODUCTS_DB = [
  {
    barcode: '4001234000123',
    name: 'Beef Burger Patty (Pack of 2)',
    category: 'diet',
    grade: 'E', // A to E rating scale
    carbon: 7.20, // kg CO2e
    details: 'Methane emissions from enteric fermentation and forest clearance for grazing land.',
    alternative: {
      name: 'Beyond Plant-Based Burger Patty',
      grade: 'A',
      carbon: 0.45,
      saving: 6.75,
      details: 'Produced directly from yellow peas, using 90% fewer greenhouse emissions than beef.'
    }
  },
  {
    barcode: '5012345678900',
    name: 'Dairy Whole Milk 1L',
    category: 'diet',
    grade: 'D',
    carbon: 3.15,
    details: 'Dairy cows enteric fermentation, manure management, and pasteurization heating energy.',
    alternative: {
      name: 'Organic Oat Milk 1L',
      grade: 'A',
      carbon: 0.60,
      saving: 2.55,
      details: 'Grown and milled locally with extremely low soil nitrogen runoff and low water footprint.'
    }
  },
  {
    barcode: '8801234567890',
    name: 'Plastic Bottled Spring Water 500ml',
    category: 'shopping',
    grade: 'D',
    carbon: 1.10,
    details: 'Single-use PET plastic extraction, bottle forming pressure, and heavy long-distance shipping.',
    alternative: {
      name: 'Tap Water in Reusable Steel Bottle',
      grade: 'A',
      carbon: 0.02,
      saving: 1.08,
      details: 'Local tap water filtered into a reusable metal thermos. Eliminates lifecycle waste entirely.'
    }
  },
  {
    barcode: '4901234567894',
    name: 'Fast Fashion Polyester Tee',
    category: 'shopping',
    grade: 'E',
    carbon: 22.50,
    details: 'Fossil-fuel derived polyester chemical extraction, high-intensity toxic dyeing, and global air freight.',
    alternative: {
      name: 'Certified Organic Cotton Tee',
      grade: 'B',
      carbon: 5.80,
      saving: 16.70,
      details: 'Rain-fed organic agricultural fields, processed with non-toxic dyes and sustainable spinning energy.'
    }
  },
  {
    barcode: '0712345678904',
    name: 'Incandescent A19 Light Bulb 60W',
    category: 'energy',
    grade: 'E',
    carbon: 84.00, // annual equivalent footprint
    details: 'Highly inefficient light conversion converting 95% of energy into heat waste, consuming high kWh.',
    alternative: {
      name: 'Smart LED Bulb 8.5W',
      grade: 'A',
      carbon: 9.60,
      saving: 74.40,
      details: 'Consumes 85% less electricity to produce equivalent lumens and lasts 25x longer.'
    }
  }
];

export const BENCHMARKS = {
  userGoal: 3000,       // target annual footprint (kg CO2e)
  regionalAverages: [
    { region: 'United States', footprint: 16000 },
    { region: 'Canada', footprint: 14200 },
    { region: 'European Union', footprint: 6800 },
    { region: 'Global Average', footprint: 4400 },
    { region: 'GreenPulse Goal', footprint: 3000 }
  ]
};
