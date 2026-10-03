const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
const context = vm.createContext({});
vm.runInContext(source.slice(source.indexOf('const PREMIER_LEG2_ROSTERS'), source.indexOf('const defaultState')), context);

test('Leg 2 replaces only current Premier rosters and preserves results and IDs', () => {
  const teams = ['svfc', 'fcbb', 'stfc', 'bufc', 'kbfc'].map(id => ({ id, division: 'premier-2026-27-main', roster: ['Old Player'] }));
  const previous = { id: 'svfc-2025', shortName: 'SVFC', division: 'premier-2025-26-main', roster: ['Historical Player'] };
  const pioneer = { id: 'dfc', division: 'pioneer-2026-27-main', roster: ['Chayan'] };
  const matches = [{ home: 'svfc', away: 'fcbb', homeScore: 2, events: [{ player: 'Baky' }] }];
  const state = { teams: [...teams, previous, pioneer], matches };
  context.updatePremierLeg2Rosters(state);
  assert.deepEqual(teams.map(t => t.roster.length), [19, 19, 20, 20, 20]);
  assert.equal(teams[0].roster.includes('Kazi'), false);
  assert.equal(teams[1].roster[0], 'Abdullah Hil Baky');
  assert.equal(teams[4].roster[19], 'Zoheb Amin');
  assert.deepEqual(previous.roster, ['Historical Player']);
  assert.deepEqual(pioneer.roster, ['Chayan']);
  assert.equal(state.matches, matches);
  assert.equal(state.matches[0].events[0].player, 'Baky');
  assert.ok(fs.existsSync(path.join(__dirname, '..', teams[0].rosterPoster)));
  teams[0].roster.push('Later Addition');
  context.updatePremierLeg2Rosters(state);
  assert.ok(teams[0].roster.includes('Later Addition'));
});
