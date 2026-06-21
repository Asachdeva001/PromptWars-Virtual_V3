/**
 * Dashboard Component Controller for GreenPulse AI
 * Manages carbon score radial gauge, breakdown bars, peer comparison, and logs list.
 */

import { store } from '../state.js';
import { BENCHMARKS } from '../data.js';
import { GAUGE_CIRCUMFERENCE, GAUGE_WARN_PCT, GAUGE_DANGER_PCT } from '../constants.js';

export class DashboardComponent {
  constructor() {
    this.gaugeFill = document.getElementById('dashboard-gauge-fill');
    this.scoreVal = document.getElementById('dashboard-score-val');
    this.gaugeDesc = document.getElementById('dashboard-gauge-desc');
    
    this.barTravel = document.getElementById('bar-travel');
    this.barEnergy = document.getElementById('bar-energy');
    this.barDiet = document.getElementById('bar-diet');
    this.barShopping = document.getElementById('bar-shopping');
    
    this.valTravel = document.getElementById('val-travel');
    this.valEnergy = document.getElementById('val-energy');
    this.valDiet = document.getElementById('val-diet');
    this.valShopping = document.getElementById('val-shopping');
    
    this.benchmarkContainer = document.getElementById('benchmark-chart');
    this.logsTableBody = document.getElementById('logs-list-body');
    this.insightsContainer = document.getElementById('dashboard-insights');
    
    // Subscribe to State Changes
    store.subscribe((state) => this.render(state));
  }

  /**
   * Main render loop for the dashboard view.
   * @param {Object} state - Current application state
   */
  render(state) {
    const logs = state.logs;
    const goal = state.profile.carbonGoal;
    
    // 1. Calculate category sums and total
    let totalCarbon = 0;
    const categorySums = {
      travel: 0,
      energy: 0,
      diet: 0,
      shopping: 0
    };

    logs.forEach(log => {
      const cat = log.category;
      if (categorySums.hasOwnProperty(cat)) {
        categorySums[cat] += log.carbon;
      }
      totalCarbon += log.carbon;
    });

    totalCarbon = parseFloat(totalCarbon.toFixed(1));

    // 2. Render Carbon Score Gauge
    // Uses GAUGE_CIRCUMFERENCE constant (2 × π × 90 ≈ 565.48)
    const pct = Math.min((totalCarbon / goal) * 100, 100);
    const strokeDashoffset = GAUGE_CIRCUMFERENCE - (pct / 100) * GAUGE_CIRCUMFERENCE;
    
    if (this.gaugeFill) {
      this.gaugeFill.style.strokeDashoffset = strokeDashoffset;
      // Change gauge colour: warning amber → danger red as budget fills
      if (pct > GAUGE_DANGER_PCT) {
        this.gaugeFill.style.stroke = 'var(--color-danger)';
      } else if (pct > GAUGE_WARN_PCT) {
        this.gaugeFill.style.stroke = 'var(--color-warning)';
      } else {
        this.gaugeFill.style.stroke = 'url(#gauge-gradient)';
      }
    }
    
    if (this.scoreVal) {
      this.scoreVal.textContent = totalCarbon.toLocaleString();
    }
    
    if (this.gaugeDesc) {
      const budgetLeft = parseFloat((goal - totalCarbon).toFixed(1));
      if (budgetLeft >= 0) {
        this.gaugeDesc.innerHTML = `You have used <strong>${pct.toFixed(0)}%</strong> of your target limit. <strong>${budgetLeft.toLocaleString()} kg</strong> left for the year.`;
      } else {
        this.gaugeDesc.innerHTML = `<span style="color: var(--color-danger); font-weight: bold;">Limit Exceeded by ${(Math.abs(budgetLeft)).toLocaleString()} kg!</span> Try reducing travel or shopping footprint.`;
      }
    }

    // 3. Render Emissions Breakdown Bar Charts
    const maxCategoryVal = Math.max(categorySums.travel, categorySums.energy, categorySums.diet, categorySums.shopping, 1);
    
    const updateBar = (bar, label, val) => {
      if (bar && label) {
        const barPct = (val / maxCategoryVal) * 100;
        bar.style.width = `${barPct}%`;
        label.textContent = `${val.toFixed(1)} kg`;
      }
    };

    updateBar(this.barTravel, this.valTravel, categorySums.travel);
    updateBar(this.barEnergy, this.valEnergy, categorySums.energy);
    updateBar(this.barDiet, this.valDiet, categorySums.diet);
    updateBar(this.barShopping, this.valShopping, categorySums.shopping);

    // 4. Render Peer & Regional comparison benchmarks
    if (this.benchmarkContainer) {
      this.benchmarkContainer.innerHTML = '';
      
      const benchmarksList = [
        ...BENCHMARKS.regionalAverages,
        { region: 'You (Projected)', footprint: totalCarbon * 12 || 0 } // Project month logs to annual (assume logs represent avg monthly)
      ];

      // Sort by footprint size to make layout look organized
      benchmarksList.sort((a, b) => b.footprint - a.footprint);

      const maxBenchmark = Math.max(...benchmarksList.map(b => b.footprint), 1);

      benchmarksList.forEach(item => {
        const isUser = item.region === 'You (Projected)';
        const widthPct = (item.footprint / maxBenchmark) * 100;
        
        const row = document.createElement('div');
        row.className = 'chart-row';
        row.style.gridTemplateColumns = '120px 1fr 90px';
        
        const label = document.createElement('span');
        label.className = 'chart-category';
        label.style.fontSize = '0.8rem';
        label.style.whiteSpace = 'nowrap';
        label.textContent = item.region;
        if (isUser) {
          label.style.color = 'var(--color-primary)';
          label.style.fontWeight = 'bold';
        }

        const barWr = document.createElement('div');
        barWr.className = 'bar-wrapper';
        barWr.style.height = '10px';
        
        const fill = document.createElement('div');
        fill.className = 'bar-fill';
        fill.style.width = `${widthPct}%`;
        fill.style.background = isUser ? 'linear-gradient(90deg, var(--color-primary), var(--color-accent))' : 'rgba(255, 255, 255, 0.1)';
        
        barWr.appendChild(fill);
        
        const valText = document.createElement('span');
        valText.className = 'chart-value';
        valText.style.fontSize = '0.8rem';
        valText.textContent = `${Math.round(item.footprint).toLocaleString()} kg/yr`;
        if (isUser) {
          valText.style.color = 'var(--color-primary)';
          valText.style.fontWeight = 'bold';
        }

        row.appendChild(label);
        row.appendChild(barWr);
        row.appendChild(valText);
        this.benchmarkContainer.appendChild(row);
      });
    }

    // 5. Render History Logs Table
    if (this.logsTableBody) {
      this.logsTableBody.innerHTML = '';
      
      if (logs.length === 0) {
        this.logsTableBody.innerHTML = `
          <tr>
            <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 20px 0;">
              No entries logged yet. Try logging via the AI assistant or tracker tab!
            </td>
          </tr>
        `;
        return;
      }

      // Sort logs descending (newest first)
      const sortedLogs = [...logs].sort((a, b) => b.timestamp - a.timestamp);

      sortedLogs.forEach(log => {
        const tr = document.createElement('tr');
        
        // Date cell
        const tdDate = document.createElement('td');
        tdDate.textContent = log.date;
        tr.appendChild(tdDate);
        
        // Category cell
        const tdCat = document.createElement('td');
        const spanTag = document.createElement('span');
        spanTag.className = `log-category-tag tag-${log.category}`;
        spanTag.textContent = log.category;
        tdCat.appendChild(spanTag);
        tr.appendChild(tdCat);
        
        // Description cell
        const tdDesc = document.createElement('td');
        const descText = log.notes || `${log.subcategory.replace(/-/g, ' ')} (${log.rawValue})`;
        tdDesc.textContent = descText;
        tr.appendChild(tdDesc);
        
        // Emissions cell
        const tdCarbon = document.createElement('td');
        tdCarbon.style.fontWeight = '600';
        tdCarbon.textContent = `${log.carbon.toFixed(1)} kg`;
        tr.appendChild(tdCarbon);
        
        // Action cell (Delete button)
        const tdAction = document.createElement('td');
        tdAction.style.textAlign = 'right';
        const delBtn = document.createElement('button');
        delBtn.className = 'log-delete-btn';
        delBtn.setAttribute('aria-label', `Delete log entry for ${descText}`);
        delBtn.innerHTML = '&times;';
        delBtn.onclick = () => {
          if (confirm(`Are you sure you want to delete this log entry?`)) {
            store.deleteLog(log.id);
          }
        };
        tdAction.appendChild(delBtn);
        tr.appendChild(tdAction);
        
        this.logsTableBody.appendChild(tr);
      });
    }

    // 6. Render Personalised Insights
    this.renderInsights(categorySums, totalCarbon, goal);
  }

  /**
   * Renders actionable personalised reduction tips based on the user's top emission category.
   * @param {Object} categorySums - Summed emissions per category { travel, energy, diet, shopping }
   * @param {number} totalCarbon - Total logged emissions in kg CO2e
   * @param {number} goal - User's annual carbon budget in kg CO2e
   */
  renderInsights(categorySums, totalCarbon, goal) {
    if (!this.insightsContainer) return;
    this.insightsContainer.innerHTML = '';

    if (totalCarbon === 0) {
      this.insightsContainer.innerHTML = '<p style="color:var(--text-muted); font-size:0.9rem;">Start logging activities to receive personalised reduction tips.</p>';
      return;
    }

    // Identify the highest-emission category
    const topCategory = Object.entries(categorySums).reduce(
      (max, [cat, val]) => (val > max.val ? { cat, val } : max),
      { cat: 'none', val: 0 }
    );

    /** Reduction tip map keyed by category */
    const tips = {
      travel: [
        '🚆 Switching one weekly car commute to public transport can cut your travel footprint by up to 70%.',
        '🚴 Cycling or walking journeys under 3 km produces zero emissions and improves health.',
        '🔋 Considering an EV for your next vehicle? Electric cars emit up to 70% less per km on green grids.'
      ],
      energy: [
        '☀️ Switching to a green energy tariff reduces your electricity footprint by up to 95%.',
        '🌡️ Lowering your thermostat by 1 °C can reduce heating energy use by ~10%.',
        '💡 Replacing old incandescent bulbs with LEDs saves up to 85% lighting energy.'
      ],
      diet: [
        '🥗 Reducing beef intake by one serving per week can save over 360 kg CO2e per year.',
        '🌱 Trying one vegan meal per day can cut your annual diet footprint by up to 50%.',
        '🐟 Swapping red meat for fish or poultry halves the per-serving emissions.'
      ],
      shopping: [
        '♻️ Buying second-hand clothing instead of new reduces the per-item carbon cost by up to 80%.',
        '🛒 Avoiding fast fashion and choosing certified organic or recycled materials reduces lifecycle impact.',
        '📦 Consolidating purchases into fewer orders reduces packaging and shipping emissions.'
      ]
    };

    const categoryTips = tips[topCategory.cat] || [];
    const pct = ((topCategory.val / totalCarbon) * 100).toFixed(0);

    const heading = document.createElement('p');
    heading.style.cssText = 'font-weight:600; margin-bottom:10px; font-size:0.95rem;';
    heading.textContent = `Your biggest contributor is ${topCategory.cat} (${pct}% of total). Here are some targeted tips:`;
    this.insightsContainer.appendChild(heading);

    const list = document.createElement('ul');
    list.style.cssText = 'list-style:none; padding:0; display:flex; flex-direction:column; gap:8px;';

    categoryTips.forEach(tip => {
      const li = document.createElement('li');
      li.style.cssText = 'font-size:0.875rem; color:var(--text-muted); padding: 8px 12px; background: rgba(16,185,129,0.06); border-left: 3px solid var(--color-primary); border-radius: 4px;';
      li.textContent = tip;
      list.appendChild(li);
    });
    this.insightsContainer.appendChild(list);

    // Progress note
    if (totalCarbon < goal) {
      const budgetLeft = (goal - totalCarbon).toFixed(0);
      const note = document.createElement('p');
      note.style.cssText = 'margin-top:12px; font-size:0.8rem; color:var(--color-primary);';
      note.textContent = `✅ You still have ${Number(budgetLeft).toLocaleString()} kg CO2e of your annual budget remaining — great work!`;
      this.insightsContainer.appendChild(note);
    } else {
      const note = document.createElement('p');
      note.style.cssText = 'margin-top:12px; font-size:0.8rem; color:var(--color-danger);';
      note.textContent = `⚠️ You have exceeded your annual carbon budget. Focus on reducing your ${topCategory.cat} activities first.`;
      this.insightsContainer.appendChild(note);
    }
  }
}
