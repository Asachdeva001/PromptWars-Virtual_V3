/**
 * Tracker Component Controller for GreenPulse AI
 * Binds manual carbon log forms and implements live calculations previews.
 */

import { store } from '../state.js';
import { calculateTravel, calculateEnergy, calculateDiet, calculateShopping } from '../engine.js';

export class TrackerComponent {
  constructor() {
    this.initTravel();
    this.initEnergy();
    this.initDiet();
    this.initShopping();
  }

  initTravel() {
    const form = document.getElementById('form-travel');
    const modeInput = document.getElementById('travel-mode');
    const distInput = document.getElementById('travel-distance');
    const unitInput = document.getElementById('travel-unit');
    const preview = document.getElementById('travel-preview-val');

    if (!form) return;

    const updatePreview = () => {
      const mode = modeInput.value;
      const dist = parseFloat(distInput.value) || 0;
      const unit = unitInput.value;
      const co2 = calculateTravel(mode, dist, unit);
      preview.textContent = `${co2.toFixed(2)} kg CO2e`;
      return co2;
    };

    distInput.addEventListener('input', updatePreview);
    modeInput.addEventListener('change', updatePreview);
    unitInput.addEventListener('change', updatePreview);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const mode = modeInput.value;
      const dist = parseFloat(distInput.value) || 0;
      const unit = unitInput.value;
      const co2 = updatePreview();

      if (dist <= 0) return;

      store.addLog({
        category: 'travel',
        subcategory: mode,
        rawValue: dist,
        carbon: co2,
        notes: `Travelled ${dist} ${unit} by ${mode.replace('-', ' ')}`
      });

      form.reset();
      updatePreview();
    });
  }

  initEnergy() {
    const form = document.getElementById('form-energy');
    const typeInput = document.getElementById('energy-type');
    const valInput = document.getElementById('energy-val');
    const unitInput = document.getElementById('energy-unit');
    const preview = document.getElementById('energy-preview-val');

    if (!form) return;

    // Show appropriate units based on type selection (Liters/Gallons only for Heating Oil)
    const updateUnitOptions = () => {
      const type = typeInput.value;
      if (type === 'oil-heating') {
        unitInput.style.display = 'block';
        if (unitInput.value === 'kwh') {
          unitInput.value = 'liters';
        }
      } else {
        unitInput.value = 'kwh';
        unitInput.style.display = 'none'; // Grid electricity and gas use kwh
      }
    };

    const updatePreview = () => {
      const type = typeInput.value;
      const val = parseFloat(valInput.value) || 0;
      const unit = unitInput.value;
      const co2 = calculateEnergy(type, val, unit);
      preview.textContent = `${co2.toFixed(2)} kg CO2e`;
      return co2;
    };

    typeInput.addEventListener('change', () => {
      updateUnitOptions();
      updatePreview();
    });
    valInput.addEventListener('input', updatePreview);
    unitInput.addEventListener('change', updatePreview);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const type = typeInput.value;
      const val = parseFloat(valInput.value) || 0;
      const unit = unitInput.value;
      const co2 = updatePreview();

      if (val <= 0) return;

      store.addLog({
        category: 'energy',
        subcategory: type,
        rawValue: val,
        carbon: co2,
        notes: `Used ${val} ${unit} of ${type.replace('-', ' ')}`
      });

      form.reset();
      updateUnitOptions();
      updatePreview();
    });

    updateUnitOptions();
  }

  initDiet() {
    const form = document.getElementById('form-diet');
    const typeInput = document.getElementById('diet-type');
    const servingsInput = document.getElementById('diet-servings');
    const preview = document.getElementById('diet-preview-val');

    if (!form) return;

    const updatePreview = () => {
      const type = typeInput.value;
      const servings = parseFloat(servingsInput.value) || 0;
      const co2 = calculateDiet(type, servings);
      preview.textContent = `${co2.toFixed(2)} kg CO2e`;
      return co2;
    };

    typeInput.addEventListener('change', updatePreview);
    servingsInput.addEventListener('input', updatePreview);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const type = typeInput.value;
      const servings = parseFloat(servingsInput.value) || 0;
      const co2 = updatePreview();

      if (servings <= 0) return;

      store.addLog({
        category: 'diet',
        subcategory: type,
        rawValue: servings,
        carbon: co2,
        notes: `Consumed ${servings} portion(s) of ${type.replace('-', ' ')}`
      });

      form.reset();
      updatePreview();
    });
  }

  initShopping() {
    const form = document.getElementById('form-shopping');
    const catInput = document.getElementById('shopping-cat');
    const spendInput = document.getElementById('shopping-spend');
    const preview = document.getElementById('shopping-preview-val');

    if (!form) return;

    const updatePreview = () => {
      const cat = catInput.value;
      const spend = parseFloat(spendInput.value) || 0;
      const co2 = calculateShopping(cat, spend);
      preview.textContent = `${co2.toFixed(2)} kg CO2e`;
      return co2;
    };

    catInput.addEventListener('change', updatePreview);
    spendInput.addEventListener('input', updatePreview);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const cat = catInput.value;
      const spend = parseFloat(spendInput.value) || 0;
      const co2 = updatePreview();

      if (spend <= 0) return;

      store.addLog({
        category: 'shopping',
        subcategory: cat,
        rawValue: spend,
        carbon: co2,
        notes: `Spent $${spend} on ${cat.replace('-', ' ')}`
      });

      form.reset();
      updatePreview();
    });
  }
}
