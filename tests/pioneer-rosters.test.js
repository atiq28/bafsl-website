const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
const context = vm.createContext({ structuredClone });
vm.runInContext(source.slice(source.indexOf('const PIONEER_2026_TEAMS'), source.indexOf('const defaultState')), context);

test('Pioneer imports all three supplied rosters and jersey numbers', () => {
  const state = context.addPioneerTeams({ teams: [] });
  assert.deepEqual(Array.from(state.teams, t => [t.name, t.roster.length]), [['DFC', 11], ['KKFC', 11], ['NKFC', 10]]);
  assert.equal(state.teams[0].jerseyNumbers.Chayan, 21);
  assert.equal(state.teams[1].jerseyNumbers.Roohany, 6);
  assert.equal(state.teams[2].jerseyNumbers.Tamim, 21);
  for (const team of state.teams) assert.ok(fs.existsSync(path.join(__dirname, '..', team.rosterPoster)));
  context.addPioneerTeams(state);
  assert.equal(state.teams.length, 3);
});

test('existing Pioneer team IDs and fixture references survive import', () => {
  const existing = { id: 'admin-dfc', name: 'dfc', division: 'pioneer-2026-27-main', roster: ['Additional Player'] };
  const premier = { id: 'premier-dfc', name: 'DFC', division: 'premier-2026-27-main', roster: [] };
  const state = context.addPioneerTeams({ teams: [existing, premier], matches: [{ home: 'admin-dfc' }] });
  assert.equal(state.teams.length, 4);
  assert.equal(existing.id, state.matches[0].home);
  assert.ok(existing.roster.includes('Chayan'));
  assert.ok(existing.roster.includes('Additional Player'));
  assert.equal(premier.roster.length, 0);
});
