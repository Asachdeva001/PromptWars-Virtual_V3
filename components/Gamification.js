/**
 * Gamification Component Controller for GreenPulse AI
 * Manages active Challenges state, Rewards Store checkouts, and dynamic Leaderboard rankings.
 */

import { store } from '../state.js';
import { CHALLENGES, REWARDS } from '../data.js';

export class GamificationComponent {
  constructor() {
    this.challengesContainer = document.getElementById('challenges-list-container');
    this.rewardsContainer = document.getElementById('rewards-shop-container');
    this.leaderboardContainer = document.getElementById('leaderboard-list-container');
    
    // Subscribe to State Updates
    store.subscribe((state) => this.render(state));
  }

  /**
   * Re-renders all gamification sections on state changes.
   * @param {Object} state - Current state store copy
   */
  render(state) {
    this.renderChallenges(state);
    this.renderRewards(state);
    this.renderLeaderboard(state);
  }

  /**
   * Renders the daily challenge items and completion triggers.
   */
  renderChallenges(state) {
    if (!this.challengesContainer) return;
    this.challengesContainer.innerHTML = '';

    CHALLENGES.forEach(ch => {
      const isCompleted = state.completedChallenges.some(item => item.id === ch.id);
      const isActive = state.activeChallenges.includes(ch.id);
      
      const card = document.createElement('div');
      card.className = 'challenge-item-card';

      const details = document.createElement('div');
      details.className = 'challenge-details';
      
      const title = document.createElement('span');
      title.className = 'challenge-title';
      title.textContent = ch.title;
      
      const desc = document.createElement('span');
      desc.className = 'challenge-desc';
      desc.textContent = ch.description;

      const meta = document.createElement('span');
      meta.className = 'challenge-meta';
      meta.textContent = `+${ch.points} Eco Points | Category: ${ch.category.toUpperCase()}`;

      details.appendChild(title);
      details.appendChild(desc);
      details.appendChild(meta);
      card.appendChild(details);

      // Button Action
      const btn = document.createElement('button');
      if (isCompleted) {
        btn.className = 'btn-claim';
        btn.disabled = true;
        btn.textContent = '✅ Completed';
      } else if (isActive) {
        btn.className = 'btn-action';
        btn.style.borderColor = 'var(--color-warning)';
        btn.style.color = 'var(--color-warning)';
        btn.textContent = 'Complete';
        btn.onclick = () => {
          store.completeChallenge(ch.id, ch.points);
          this.triggerBotChallengeNotification(ch);
        };
      } else {
        btn.className = 'btn-action';
        btn.textContent = 'Join';
        btn.onclick = () => store.joinChallenge(ch.id);
      }

      card.appendChild(btn);
      this.challengesContainer.appendChild(card);
    });
  }

  /**
   * Renders rewards shop items and purchases codes.
   */
  renderRewards(state) {
    if (!this.rewardsContainer) return;
    this.rewardsContainer.innerHTML = '';

    REWARDS.forEach(rw => {
      const claimedRecord = state.claimedRewards.find(item => item.id === rw.id);
      
      const card = document.createElement('div');
      card.className = 'reward-item-card';

      const details = document.createElement('div');
      details.className = 'reward-details';
      
      const title = document.createElement('span');
      title.className = 'reward-title';
      title.textContent = rw.title;

      const desc = document.createElement('span');
      desc.className = 'reward-desc';
      desc.textContent = rw.description;

      const meta = document.createElement('span');
      meta.className = 'reward-meta';
      meta.style.color = 'var(--color-secondary)';
      meta.textContent = `Cost: ${rw.pointsCost} Points | Sponsor: ${rw.sponsor}`;

      details.appendChild(title);
      details.appendChild(desc);
      details.appendChild(meta);

      if (claimedRecord) {
        const codeBox = document.createElement('div');
        codeBox.style.marginTop = '6px';
        codeBox.style.padding = '4px 8px';
        codeBox.style.fontSize = '0.75rem';
        codeBox.style.borderRadius = '4px';
        codeBox.style.background = 'rgba(6, 182, 212, 0.08)';
        codeBox.style.border = '1px dashed var(--color-secondary)';
        codeBox.innerHTML = `Code: <code style="font-weight:700;color:var(--text-primary);">${claimedRecord.code}</code>`;
        details.appendChild(codeBox);
      }

      card.appendChild(details);

      // Claim button
      const btn = document.createElement('button');
      btn.className = 'btn-claim';
      
      if (claimedRecord) {
        btn.textContent = 'Claimed';
        btn.disabled = true;
      } else {
        btn.textContent = 'Redeem';
        // Disable if user has insufficient points
        if (state.points < rw.pointsCost) {
          btn.disabled = true;
          btn.title = 'Insufficient points';
        } else {
          btn.onclick = () => {
            if (confirm(`Redeem "${rw.title}" for ${rw.pointsCost} points?`)) {
              store.redeemReward(rw.id, rw.pointsCost);
            }
          };
        }
      }

      card.appendChild(btn);
      this.rewardsContainer.appendChild(card);
    });
  }

  /**
   * Dynamically renders and ranks peers against the user's live values.
   */
  renderLeaderboard(state) {
    if (!this.leaderboardContainer) return;
    this.leaderboardContainer.innerHTML = '';

    // Mock competitors
    const leaderboardData = [
      { name: 'Sarah Miller', points: 340, streak: 6 },
      { name: 'Alex Johnson', points: 280, streak: 4 },
      { name: 'David Carter', points: 190, streak: 2 },
      { name: 'Chloe Davis', points: 80, streak: 1 },
      { name: `${state.profile.name} (You)`, points: state.points, streak: state.streak.current, isUser: true }
    ];

    // Sort peers based on accumulated points descending
    leaderboardData.sort((a, b) => b.points - a.points);

    leaderboardData.forEach((peer, index) => {
      const item = document.createElement('div');
      item.className = 'leaderboard-item';
      if (peer.isUser) {
        item.classList.add('user-row');
      }

      const left = document.createElement('div');
      left.className = 'rank-name';
      
      const rank = document.createElement('span');
      rank.className = 'rank-number';
      rank.textContent = `${index + 1}.`;

      const name = document.createElement('span');
      name.textContent = peer.name;
      if (peer.isUser) {
        name.style.fontWeight = 'bold';
      }

      left.appendChild(rank);
      left.appendChild(name);

      const right = document.createElement('div');
      right.style.textAlign = 'right';
      right.innerHTML = `<span style="font-weight:600;">${peer.points} pts</span> <span style="font-size:0.75rem;color:var(--text-muted);margin-left:8px;">🔥 ${peer.streak}d</span>`;

      item.appendChild(left);
      item.appendChild(right);
      this.leaderboardContainer.appendChild(item);
    });
  }

  /**
   * Helper to append a congratulations card to the chat log upon challenge success.
   */
  triggerBotChallengeNotification(challenge) {
    const chatHist = document.getElementById('chat-history');
    if (chatHist) {
      const msgDiv = document.createElement('div');
      msgDiv.className = 'chat-msg bot';
      msgDiv.innerHTML = `<p>🏆 <strong>Challenge Completed!</strong> You successfully completed **${challenge.title}** and earned <strong>${challenge.points} Eco Points</strong>! Keep up the amazing work! 🎉</p>`;
      chatHist.appendChild(msgDiv);
      chatHist.scrollTop = chatHist.scrollHeight;
    }
  }
}
