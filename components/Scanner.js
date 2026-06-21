/**
 * Scanner Component Controller for GreenPulse AI
 * Simulates a product barcode camera scanner, lists ecological lifecycle grades,
 * and proposes low-carbon swap alternatives.
 */

import { PRODUCTS_DB } from '../data.js';
import { store } from '../state.js';
import { POINTS_ECO_SWAP, SCANNER_ALIGN_DELAY_MS, SCANNER_DECODE_DELAY_MS } from '../constants.js';

export class ScannerComponent {
  constructor() {
    this.selectInput = document.getElementById('scanner-search-select');
    this.viewportText = document.getElementById('scanner-viewport-text');
    this.laser = document.getElementById('scanner-laser-bar');
    
    this.emptyState = document.getElementById('scanner-empty-state');
    this.resultsData = document.getElementById('scanner-results-data');
    
    this.gradeBadge = document.getElementById('scan-grade-badge');
    this.productName = document.getElementById('scan-product-name');
    this.carbonFootprint = document.getElementById('scan-carbon-footprint');
    this.lifecycleDesc = document.getElementById('scan-lifecycle-desc');
    
    this.swapCard = document.getElementById('scan-swap-card');
    this.swapName = document.getElementById('scan-swap-name');
    this.swapDesc = document.getElementById('scan-swap-desc');
    this.swapBadge = document.getElementById('scan-swap-badge');
    this.savingVal = document.getElementById('scan-saving-val');
    this.swapLogBtn = document.getElementById('btn-scan-log-swap');
    
    this.selectedProduct = null;

    this.init();
  }

  init() {
    if (!this.selectInput) return;

    // Populate search select dropdown with database products
    this.selectInput.innerHTML = '<option value="">-- Choose a product to simulate scan --</option>';
    PRODUCTS_DB.forEach(prod => {
      const opt = document.createElement('option');
      opt.value = prod.barcode;
      opt.textContent = `${prod.name} [Barcode: ${prod.barcode}]`;
      this.selectInput.appendChild(opt);
    });

    this.selectInput.addEventListener('change', (e) => this.handleScan(e.target.value));
  }

  /**
   * Simulates visual scanner animations and displays the result card.
   * @param {string} barcode - Product barcode key
   */
  handleScan(barcode) {
    if (!barcode) {
      this.selectedProduct = null;
      if (this.emptyState) this.emptyState.style.display = 'block';
      if (this.resultsData) this.resultsData.style.display = 'none';
      if (this.viewportText) this.viewportText.textContent = 'Point camera at a barcode';
      return;
    }

    const product = PRODUCTS_DB.find(p => p.barcode === barcode);
    if (!product) return;
    this.selectedProduct = product;

    // 1. Simulate camera scanner visual loading stages
    if (this.viewportText) this.viewportText.textContent = 'Aligning barcode...';
    if (this.laser) {
      this.laser.style.animationPlayState = 'running';
      this.laser.style.backgroundColor = 'var(--color-primary)';
    }

    setTimeout(() => {
      if (this.viewportText) this.viewportText.textContent = 'Decoding barcode metadata...';
      if (this.laser) this.laser.style.backgroundColor = 'var(--color-secondary)';
      
      setTimeout(() => {
        if (this.viewportText) this.viewportText.textContent = 'Scan Success!';
        if (this.laser) {
          this.laser.style.animationPlayState = 'paused';
          this.laser.style.backgroundColor = 'rgba(255,255,255,0.05)';
        }
        this.displayProductResults(product);
      }, SCANNER_DECODE_DELAY_MS);
    }, SCANNER_ALIGN_DELAY_MS);
  }

  /**
   * Populates the scan result panel with grades and comparison alternative data.
   * @param {Object} product - Product database record
   */
  displayProductResults(product) {
    if (this.emptyState) this.emptyState.style.display = 'none';
    if (this.resultsData) this.resultsData.style.display = 'flex';
    
    // Set grade badge rating and CSS class color
    if (this.gradeBadge) {
      this.gradeBadge.textContent = product.grade;
      this.gradeBadge.className = `impact-grade-badge grade-${product.grade}`;
    }

    if (this.productName) this.productName.textContent = product.name;
    if (this.carbonFootprint) {
      this.carbonFootprint.textContent = `${product.carbon.toFixed(2)} kg CO2e`;
      // Set warning color based on severity
      if (['D', 'E'].includes(product.grade)) {
        this.carbonFootprint.style.color = 'var(--color-danger)';
      } else if (product.grade === 'C') {
        this.carbonFootprint.style.color = 'var(--color-warning)';
      } else {
        this.carbonFootprint.style.color = 'var(--color-success)';
      }
    }

    if (this.lifecycleDesc) this.lifecycleDesc.textContent = product.details;

    // Show swap alternative suggestion if present
    if (product.alternative && this.swapCard) {
      this.swapCard.style.display = 'block';
      if (this.swapName) this.swapName.textContent = product.alternative.name;
      if (this.swapDesc) this.swapDesc.textContent = product.alternative.details;
      if (this.swapBadge) {
        this.swapBadge.textContent = product.alternative.grade;
        this.swapBadge.className = `impact-grade-badge grade-${product.alternative.grade}`;
        this.swapBadge.style.width = '38px';
        this.swapBadge.style.height = '38px';
        this.swapBadge.style.fontSize = '1.2rem';
      }
      
      if (this.savingVal) {
        const pctSaved = Math.round((product.alternative.saving / product.carbon) * 100);
        this.savingVal.textContent = `${product.alternative.saving.toFixed(2)} kg CO2e (-${pctSaved}%)`;
      }

      // Re-enable button and bind click events
      if (this.swapLogBtn) {
        this.swapLogBtn.disabled = false;
        this.swapLogBtn.textContent = 'Log Swap alternative instead';
        this.swapLogBtn.onclick = () => this.logSwapAlternative(product);
      }
    } else if (this.swapCard) {
      this.swapCard.style.display = 'none';
    }
  }

  /**
   * Logs a green swap alternative to state, awards eco points, and triggers notification prompts.
   * @param {Object} product - Product database record
   */
  logSwapAlternative(product) {
    if (!product || !product.alternative) return;
    const alt = product.alternative;

    // Add log entry
    store.addLog({
      category: product.category,
      subcategory: product.category === 'diet' ? alt.name : 'electronics',
      rawValue: 1,
      carbon: alt.carbon,
      notes: `Swapped: [${product.name}] for [${alt.name}]`
    });

    // Reward points for carbon-conscious swap actions
    store.state.points += POINTS_ECO_SWAP;
    store.save();

    // Visual button success indicators
    if (this.swapLogBtn) {
      this.swapLogBtn.disabled = true;
      this.swapLogBtn.textContent = `Alternative Logged! +${POINTS_ECO_SWAP} Eco Points`;
    }
    if (this.viewportText) {
      this.viewportText.textContent = `Success! +${POINTS_ECO_SWAP} Eco Points Awarded.`;
    }

    // Proactively push a notification alert to the Chat assistant
    const chatHist = document.getElementById('chat-history');
    if (chatHist) {
      const msgDiv = document.createElement('div');
      msgDiv.className = 'chat-msg bot';
      msgDiv.setAttribute('role', 'status');
      const p = document.createElement('p');
      p.innerHTML = `🌱 <strong>Eco Swap Logged!</strong> You swapped <em>${this.escapeHTML(product.name)}</em> with <em>${this.escapeHTML(alt.name)}</em>, saving <strong>${alt.saving.toFixed(2)} kg CO2e</strong>. I've added <strong>${POINTS_ECO_SWAP} Eco Points</strong> to your account!`;
      msgDiv.appendChild(p);
      chatHist.appendChild(msgDiv);
      chatHist.scrollTop = chatHist.scrollHeight;
    }
  }

  /**
   * Escapes a plain-text string for safe insertion into HTML content.
   * Prevents XSS when rendering user-originated or external data.
   * @param {string} str - Raw string
   * @returns {string} HTML-escaped string
   */
  escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }
}
