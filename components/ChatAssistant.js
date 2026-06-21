/**
 * ChatAssistant Component Controller for GreenPulse AI
 * Governs the interactive conversational NLP interface with inline verification cards.
 */

import { parseNaturalLanguage } from '../parser.js';
import { store } from '../state.js';

export class ChatAssistantComponent {
  constructor() {
    this.chatForm = document.getElementById('chat-input-form');
    this.chatInput = document.getElementById('chat-textbox');
    this.chatHistory = document.getElementById('chat-history');
    this.suggestionsContainer = document.getElementById('chat-suggestion-chips');

    this.init();
  }

  init() {
    if (!this.chatForm) return;

    this.chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = this.chatInput.value.trim();
      if (!text) return;

      this.processUserMessage(text);
      this.chatInput.value = '';
    });

    // Wire suggestion chips clicks
    if (this.suggestionsContainer) {
      this.suggestionsContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.chip-btn');
        if (btn) {
          const text = btn.getAttribute('data-input');
          if (text) {
            this.processUserMessage(text);
          }
        }
      });
    }
  }

  processUserMessage(text) {
    this.appendMessage('user', text);
    
    // Process using parser logic first
    const parseResult = parseNaturalLanguage(text);
    
    // If the intent is unknown, route conversational chat to Vertex AI on GCP
    if (parseResult.intent === 'unknown') {
      const API_URL = typeof window !== 'undefined' 
        ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:8080/chat' 
            : 'https://us-central1-greenpulse-ai.cloudfunctions.net/api/chat')
        : null;

      if (API_URL) {
        // Extract chat history context
        const msgDivs = Array.from(this.chatHistory.querySelectorAll('.chat-msg'));
        const chatHistoryList = msgDivs.map(msg => ({
          sender: msg.classList.contains('user') ? 'user' : 'bot',
          text: msg.querySelector('p').textContent
        })).slice(-8); // Limit to last 8 turns

        fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, history: chatHistoryList })
        })
        .then(res => res.json())
        .then(data => {
          if (data && data.success && data.reply) {
            this.appendMessage('bot', data.reply);
          } else {
            this.handleParserResult(parseResult);
          }
        })
        .catch(() => {
          this.handleParserResult(parseResult);
        });
        return;
      }
    }
    
    // Simulate AI thinking delay for high-fidelity experience
    setTimeout(() => {
      this.handleParserResult(parseResult);
    }, 450);
  }

  /**
   * Handles actions based on the mapped intent.
   * @param {Object} res - Parser intent result
   */
  handleParserResult(res) {
    const state = store.getState();
    
    if (res.intent === 'help') {
      this.appendMessage('bot', res.message);
    } 
    else if (res.intent === 'query') {
      let reply = '';
      if (res.queryType === 'streak') {
        reply = `🔥 Your current daily streak is **${state.streak.current} day(s)**. Log an activity tomorrow to boost your streak!`;
      } else if (res.queryType === 'points') {
        reply = `🍃 You have **${state.points} Eco Points** in your balance. You can redeem these for real reforestation trees in the Challenges & Rewards section!`;
      } else if (res.queryType === 'challenges') {
        const activeCount = state.activeChallenges.length;
        reply = `🏆 You have **${activeCount} active challenge(s)** joined. Open the Challenges section to complete them!`;
      } else {
        // Default dashboard score check
        let total = state.logs.reduce((sum, log) => sum + log.carbon, 0);
        reply = `📊 Your total logged emissions for the year are **${total.toFixed(1)} kg CO2e**, against an annual target limit of **${state.profile.carbonGoal.toLocaleString()} kg CO2e**.`;
      }
      this.appendMessage('bot', reply);
    } 
    else if (res.intent === 'log') {
      // Create a high-fidelity interactive log confirmation card inside chat feed
      this.appendConfirmationCard(res);
    } 
    else {
      // Unknown fallback
      this.appendMessage('bot', res.message);
    }
  }

  /**
   * Appends a standard text bubble to history.
   * @param {string} sender - 'user' or 'bot'
   * @param {string} text - Text message markup
   */
  appendMessage(sender, text) {
    if (!this.chatHistory) return;
    
    const bubble = document.createElement('div');
    bubble.className = `chat-msg ${sender}`;
    
    // Process markdown-like bolding **text** to html strong tags
    let htmlContent = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Process list points
    htmlContent = htmlContent.replace(/\n/g, '<br>');
    
    bubble.innerHTML = `<p>${htmlContent}</p>`;
    this.chatHistory.appendChild(bubble);
    this.scrollChatToBottom();
  }

  /**
   * Appends an interactive confirmation card for logs.
   * @param {Object} logData - Parsed logging metadata
   */
  appendConfirmationCard(logData) {
    if (!this.chatHistory) return;
    
    const cardId = 'confirm_card_' + Date.now();
    const bubble = document.createElement('div');
    bubble.className = 'chat-msg bot';
    bubble.id = cardId;

    const friendlyMode = logData.subcategory.replace('-', ' ');
    
    bubble.innerHTML = `
      <p>📝 <strong>Activity Detected:</strong></p>
      <p>I calculated emissions for <strong>${friendlyMode}</strong> (${logData.rawValue} ${logData.unit}):</p>
      <p style="font-weight:700; color:var(--color-accent); font-size:1.05rem;">Footprint: ${logData.carbon.toFixed(2)} kg CO2e</p>
      <div class="chat-confirm-action" id="${cardId}_actions">
        <p style="font-size:0.8rem; color:var(--text-muted);">Would you like to log this activity to your dashboard?</p>
        <div class="confirm-btn-group">
          <button class="btn-mini confirm" id="${cardId}_btn_ok">Confirm Log</button>
          <button class="btn-mini cancel" id="${cardId}_btn_cancel">Cancel</button>
        </div>
      </div>
    `;

    this.chatHistory.appendChild(bubble);
    this.scrollChatToBottom();

    // Bind action events
    const okBtn = document.getElementById(`${cardId}_btn_ok`);
    const cancelBtn = document.getElementById(`${cardId}_btn_cancel`);
    const actionsPanel = document.getElementById(`${cardId}_actions`);

    if (okBtn && cancelBtn && actionsPanel) {
      okBtn.addEventListener('click', () => {
        // Record in store
        const log = store.addLog({
          category: logData.category,
          subcategory: logData.subcategory,
          rawValue: logData.rawValue,
          carbon: logData.carbon,
          notes: `${logData.rawValue} ${logData.unit} via ${friendlyMode}`
        });

        // Award eco logging points
        store.state.points += 5;
        store.save();

        actionsPanel.innerHTML = `
          <p style="color:var(--color-primary); font-weight:bold; font-size:0.8rem;">
            ✓ Logged successfully! +5 Eco Points awarded.
          </p>
        `;
        
        // Add dynamic success bubble
        setTimeout(() => {
          this.appendMessage('bot', `I've updated your score. Your streak is now **${store.state.streak.current} day(s)**!`);
        }, 300);
      });

      cancelBtn.addEventListener('click', () => {
        actionsPanel.innerHTML = `
          <p style="color:var(--color-danger); font-size:0.8rem;">
            ✗ Logging request cancelled.
          </p>
        `;
      });
    }
  }

  scrollChatToBottom() {
    if (this.chatHistory) {
      this.chatHistory.scrollTop = this.chatHistory.scrollHeight;
    }
  }
}
