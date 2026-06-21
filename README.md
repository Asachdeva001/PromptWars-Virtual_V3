# GreenPulse AI — Carbon Footprint Awareness Platform

GreenPulse AI is an all-in-one carbon footprint tracking, reduction, and gamification platform. It utilizes a conversational **Smart AI Assistant** that dynamically parses free-text user statements to calculate and log travel, energy, shopping, and dietary emissions, alongside gamification features (streaks, points, eco-challenges, rewards) and an interactive barcode product scanner.

---

## 1. Vertical Choice & Problem Statement Alignment

GreenPulse AI addresses the **Carbon Footprint Awareness Platform** vertical. It helps individuals understand, track, and reduce their carbon footprint through simple actions and personalized insights.

Key alignment vectors include:
*   **Smart Conversational Assistant**: Allows users to log footprint data using natural phrasing (e.g., *"I drove 15 miles in my EV"* or *"ate a beef burger serving"*), reducing logging friction and improving accessibility.
*   **Aesthetic & Dynamic Visual Feedback**: Renders an interactive SVG Radial Progress Gauge representing the user's Carbon Score budget, and color-coded horizontal bars for category breakdowns.
*   **Gamification mechanics**: Encourages continuous engagement through a daily streak tracker, Eco Points rewards, community challenges, and a sponsor reward redemption shop.
*   **Eco-Swap Product Scanner**: Simulates product barcode recognition to output environmental grades (A-E) and suggest sustainable alternative swaps (e.g., Whole Milk ➔ Oat Milk) that reward green points on logging.

---

## 2. Architecture & File Structure

The project is structured as a zero-compile, zero-dependency, modular Single-Page Application (SPA) built with vanilla semantic HTML5, CSS3 Custom Properties, and ES6 Javascript modules.

```
├── .gitignore
├── Problem_statement.md
├── Solution.md
├── agent.md
├── instructions.md
├── index.html            # Main HTML Shell & View landmarks
├── index.css             # CSS variables, animations & responsive styling
├── package.json          # ESM module configuration and npm scripts
├── main.js               # Entry point; coordinates SPA tab routing
├── state.js              # Central State Store with PubSub event system
├── engine.js             # Carbon Calculations Engine (EPA/Defra factors)
├── parser.js             # Conversational Natural Language Intent Parser
├── data.js               # Static databases (challenges, rewards, scan items)
├── components/           # UI Component View Controllers
│   ├── ChatAssistant.js  # Interactive chat and inline confirmation cards
│   ├── Dashboard.js      # Radial gauge, charts, and historical logs table
│   ├── Tracker.js        # Manual form inputs and live footprint previews
│   ├── Scanner.js        # Simulated product camera scanner and swaps
│   └── Gamification.js   # Challenge progress, rewards shop, leaderboard
└── tests/                # Zero-dependency Native Test Suite
    ├── run.js            # Node test execution runner imports
    ├── engine.test.js    # Unit tests for carbon math formulas
    ├── state.test.js     # Unit tests for streak/points state changes
    └── parser.test.js    # Unit tests for conversational parsing
```

---

## 3. Core Logic & Implementation Details

### A. Conversational NLP Parser (`parser.js`)
The parser maps natural language strings to structured intents (`log`, `query`, `help`, `unknown`):
1.  **Regex Tokenizers**: Detects category keywords (`drove`, `flight`, `electricity`, `ate`, `bought`) and extracts corresponding numbers and units (e.g., `miles`, `kWh`, `servings`, `USD`).
2.  **Subcategory Classification**: Identifies transport modes (electric vs petrol), electricity supply types (green vs grid), food diets (beef vs vegan), and shopping categories to fetch matching emission coefficients.
3.  **Interactive Confirmation Cards**: To ensure safety and prevent erroneous logs, the assistant does not write logs silently. Instead, it renders an inline confirmation block directly in the chat feed containing a **"Confirm Log"** or **"Cancel"** action button.

### B. Carbon Calculations Engine (`engine.js`)
All carbon values represent kilograms of carbon dioxide equivalents (kg CO2e) derived from standard EPA and Defra factors:
*   **Travel (per km)**: Petrol Car (0.17 kg), Hybrid (0.11 kg), Electric Car (0.05 kg), Bus (0.03 kg), Train (0.02 kg), Flight Domestic (0.25 kg), Flight International (0.18 kg).
*   **Energy**: Grid Electricity (0.38 kg/kWh), Solar/Green (0.02 kg/kWh), Gas Heating (0.18 kg/kWh), Heating Oil (2.68 kg/liter).
*   **Diet (per serving/meal)**: Beef & Lamb (7.0 kg), Pork & Poultry (2.2 kg), Dairy Whole Milk (1.5 kg), Vegetarian meal (0.5 kg), Vegan meal (0.2 kg).
*   **Shopping (per USD spent)**: Electronics (0.45 kg), Clothing (0.35 kg), Furniture (0.30 kg), Services (0.05 kg).

### C. Streak & Gamification Logic (`state.js`)
*   **Streak Check**: Compares log dates. Consecutive calendar day logs increment the streak counter. Re-logging on the same day maintains the streak without duplicate bonuses. Logging after a skipped day resets the streak back to 1.
*   **Rewards Checkout**: Restricts item redemption based on the user's current points balance. Successful redemptions deduct points and generate unique claim codes (e.g., `GP-XXXXXX-XXXX`).

---

## 4. Key Assumptions Made

1.  **Projected Emissions**: The peer-comparison widget projects the user's monthly log total to an annual rate (Multiplied by 12) to compare with standard regional annual footprints.
2.  **Product Scanner**: A full barcode camera feed parsing physical lines requires heavy external APIs. We assume a high-fidelity visual simulator using custom CSS scanner animations, dropdown product lists, barcode lookups, and alternative swap logic is sufficient for showcase.
3.  **Local Storage Persistence**: App state is cached locally in `localStorage`. In Node.js environment, the app automatically falls back to an in-memory database mock to allow unit tests to run seamlessly without global object errors.

---

## 5. Evaluation Features Highlight

*   **Security (Medium Impact)**: Implements strict input verification, cleans user query strings to prevent cross-site scripting (XSS), and isolates states between test executions.
*   **Efficiency (Medium Impact)**: A single-page architecture avoids page reload latency. Custom SVGs replace heavy external image assets, keeping bundle sizes under 1MB.
*   **Testing (Low Impact)**: Complete test coverage checking calculations, streak transitions, and NLP keyword maps.
*   **Accessibility (Low Impact)**: Keyboard-navigable page view tabs, high-contrast text tags (WCAG 2.1 AA compliant ratios), visible custom focus rings (`outline-offset`), and screen-reader announcements utilizing `aria-live`.

---

## 6. How to Run & Verify

### Running the App Locally
Since the project uses pure ES6 modules and vanilla components, it does not require complex build pipelines. You can launch the application by opening the `index.html` file in any modern web browser or serving it using a static local server.

To host it locally via Node:
```bash
# Install a lightweight static server if desired
npm install -g local-server
# Or run with python
python -m http.server 8080
```
Then open `http://localhost:8080` in your browser.

### Running Automated Tests
We use Node.js's native test runner (available in Node v18+ and stable in v22).
To run the 16 unit assertions checking calculators, state manager, and parser:
```bash
npm test
```
This runs the equivalent command: `node tests/run.js` and outputs standard TAP results.
