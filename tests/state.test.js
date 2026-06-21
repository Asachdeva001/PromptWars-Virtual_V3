import test from 'node:test';
import assert from 'node:assert';
import { store } from '../state.js';

test('State Store: Initial State & Reset', () => {
  store.reset();
  const state = store.getState();
  assert.strictEqual(state.points, 0);
  assert.strictEqual(state.logs.length, 0);
  assert.strictEqual(state.streak.current, 0);
  assert.strictEqual(state.activeChallenges.length, 0);
  assert.strictEqual(state.completedChallenges.length, 0);
  assert.strictEqual(state.claimedRewards.length, 0);
  assert.strictEqual(state.profile.name, 'Eco Citizen');
});

test('State Store: Logging and Streak Checking', () => {
  store.reset();
  
  // Log first entry
  const log = store.addLog({
    category: 'travel',
    subcategory: 'car-petrol',
    rawValue: 100,
    carbon: 17,
    notes: 'Commute to office'
  });

  assert.ok(log.id);
  assert.strictEqual(log.category, 'travel');
  assert.strictEqual(log.rawValue, 100);
  assert.strictEqual(log.carbon, 17);
  assert.strictEqual(log.notes, 'Commute to office');

  const state1 = store.getState();
  assert.strictEqual(state1.logs.length, 1);
  assert.strictEqual(state1.streak.current, 1); // Streak starts at 1
  assert.strictEqual(state1.points, 10); // First log awards 10 points

  // Log second entry on SAME day (should not increment streak or award streak points)
  store.addLog({
    category: 'diet',
    subcategory: 'vegan',
    rawValue: 1,
    carbon: 0.2
  });

  const state2 = store.getState();
  assert.strictEqual(state2.logs.length, 2);
  assert.strictEqual(state2.streak.current, 1); // Streak remains 1
  assert.strictEqual(state2.points, 10); // No new streak points

  // Delete a log
  store.deleteLog(log.id);
  const state3 = store.getState();
  assert.strictEqual(state3.logs.length, 1);
  assert.strictEqual(state3.logs[0].subcategory, 'vegan');
});

test('State Store: Streak Progression (Consecutive vs Broken Days)', () => {
  store.reset();
  const today = new Date().toISOString().split('T')[0];
  
  // Backdate streak lastLoggedDate to simulate yesterday
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  store.state.streak.current = 1;
  store.state.streak.lastLoggedDate = yesterday;
  store.state.points = 10;
  
  // Now add log for today
  store.addLog({
    category: 'energy',
    subcategory: 'electricity-grid',
    rawValue: 10,
    carbon: 3.8
  });

  const state = store.getState();
  assert.strictEqual(state.streak.current, 2); // Streak increments to 2
  // Points should be: 10 initial + 10 base logging + (2 * 5) streak bonus = 30 points
  assert.strictEqual(state.points, 30);

  // Now simulate a broken streak (last logged 3 days ago)
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  store.state.streak.lastLoggedDate = threeDaysAgo;
  store.state.streak.current = 5; // User had a 5-day streak
  
  // Log today
  store.addLog({
    category: 'diet',
    subcategory: 'vegetarian',
    rawValue: 1,
    carbon: 0.5
  });

  const stateBroken = store.getState();
  assert.strictEqual(stateBroken.streak.current, 1); // Streak resets to 1
  assert.strictEqual(stateBroken.streak.lastLoggedDate, today);
});

test('State Store: Challenge Management', () => {
  store.reset();
  
  // Join challenge
  store.joinChallenge('challenge_01');
  let state = store.getState();
  assert.deepStrictEqual(state.activeChallenges, ['challenge_01']);
  
  // Join same challenge again (should be ignored)
  store.joinChallenge('challenge_01');
  state = store.getState();
  assert.deepStrictEqual(state.activeChallenges, ['challenge_01']);

  // Complete challenge and verify points reward
  store.completeChallenge('challenge_01', 50);
  state = store.getState();
  assert.strictEqual(state.activeChallenges.length, 0);
  assert.strictEqual(state.completedChallenges.length, 1);
  assert.strictEqual(state.completedChallenges[0].id, 'challenge_01');
  assert.strictEqual(state.points, 50); // Earned 50 points
});

test('State Store: Reward Redemption', () => {
  store.reset();
  store.state.points = 100;

  // Redeem reward with enough points
  const success = store.redeemReward('reward_tree', 80);
  assert.strictEqual(success, true);
  
  let state = store.getState();
  assert.strictEqual(state.points, 20); // 100 - 80 = 20
  assert.strictEqual(state.claimedRewards.length, 1);
  assert.strictEqual(state.claimedRewards[0].id, 'reward_tree');
  assert.ok(state.claimedRewards[0].code.startsWith('GP-'));

  // Try to redeem reward with insufficient points
  const fail = store.redeemReward('reward_mug', 50);
  assert.strictEqual(fail, false);
  
  state = store.getState();
  assert.strictEqual(state.points, 20); // Remains 20
  assert.strictEqual(state.claimedRewards.length, 1); // Remains 1
});

test('State Store: Subscriptions (PubSub)', () => {
  store.reset();
  let callCount = 0;
  let receivedState = null;

  const unsubscribe = store.subscribe((state) => {
    callCount++;
    receivedState = state;
  });

  // Perform state action
  store.addLog({
    category: 'shopping',
    subcategory: 'clothing',
    rawValue: 50,
    carbon: 17.5
  });

  assert.strictEqual(callCount, 1);
  assert.strictEqual(receivedState.logs.length, 1);

  // Unsubscribe
  unsubscribe();

  // Perform another state action
  store.addLog({
    category: 'shopping',
    subcategory: 'electronics',
    rawValue: 100,
    carbon: 45
  });

  assert.strictEqual(callCount, 1); // Call count should remain 1
});
