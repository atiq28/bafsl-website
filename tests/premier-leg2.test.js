const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../app.js'), 'utf8');
const context = vm.createContext({ structuredClone });
vm.runInContext(source.slice(source.indexOf('const PREMIER_LEG2_FIXTURES'), source.indexOf('const defaultState')), context);
const migrate = (state) => context.addPremierLeg2(state);

test('Leg 2 has ten matches, two per weekend, and four per team', () => {
  const state = migrate({ matches: [] });
  assert.equal(state.matches.length, 10);
  for (const week of [7, 8, 9, 10, 11]) assert.equal(state.matches.filter(m => m.week === week).length, 2);
  for (const team of ['svfc', 'fcbb', 'stfc', 'bufc', 'kbfc']) {
    assert.equal(state.matches.filter(m => m.home === team).length, 2);
    assert.equal(state.matches.filter(m => m.away === team).length, 2);
  }
  assert.equal(state.matches[9].dateEnd, '2027-01-31');
  assert.ok(state.matches.every(m => !m.time && !m.venue && m.homeScore === null));
});

test('migration preserves saved results and avoids duplicate fixtures', () => {
  const existing = { id: 'cloud-match', division: 'premier-2026-27-main', home: 'fcbb', away: 'svfc', date: '2026-09-20', homeScore: 3, awayScore: 1, status: 'completed' };
  const leg1 = { id: 'leg1', division: existing.division, home: 'svfc', away: 'fcbb', date: '2026-05-03' };
  const state = migrate({ matches: [leg1, existing] });
  assert.equal(state.matches.length, 11);
  assert.equal(state.matches[1], existing);
  assert.equal(state.matches[1].homeScore, 3);
  migrate(state);
  assert.equal(state.matches.length, 11);
  state.matches.pop();
  migrate(state);
  assert.equal(state.matches.length, 10, 'admin deletions survive subsequent loads');
});

test('both local and cloud loading apply the schedule migration', () => {
  assert.match(source, /return updatePremierLeg2Rosters\(addPioneerTeams\(addPremierLeg2\(\{ .*JSON\.parse\(saved\)/);
  assert.match(source, /state = updatePremierLeg2Rosters\(addPioneerTeams\(addPremierLeg2\(\{ .*rows\[0\]\.data/);
});
