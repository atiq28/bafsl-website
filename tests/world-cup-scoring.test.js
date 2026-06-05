const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { eligibleTeams, trimInvalidResults, scorePrediction } = require("../world-cup-scoring.js");

const stages = [
  { id: "group_winners", count: 12, points: 2 },
  { id: "group_runners_up", count: 12, points: 1 },
  { id: "best_thirds", count: 8, points: 1 },
  { id: "round_of_16", count: 16, points: 2 },
  { id: "quarterfinals", count: 8, points: 4 },
  { id: "semifinals", count: 4, points: 8 },
  { id: "finalists", count: 2, points: 16 },
  { id: "champion", count: 1, points: 32 }
];

const teams = Array.from({ length: 48 }, (_, index) => `Team ${index + 1}`);

test("admin choices remove teams already assigned to an earlier group position", () => {
  const results = {
    group_winners: teams.slice(0, 12),
    group_runners_up: teams.slice(12, 24),
    best_thirds: teams.slice(24, 32)
  };

  assert.deepEqual(eligibleTeams("group_runners_up", results, teams), teams.slice(12));
  assert.deepEqual(eligibleTeams("best_thirds", results, teams), teams.slice(24));
  assert.deepEqual(eligibleTeams("round_of_16", results, teams), teams.slice(0, 32));
});

test("later knockout choices are limited to teams from the previous result stage", () => {
  const results = {
    round_of_16: teams.slice(0, 16),
    quarterfinals: teams.slice(0, 8),
    semifinals: teams.slice(0, 4),
    finalists: teams.slice(0, 2)
  };

  assert.deepEqual(eligibleTeams("quarterfinals", results, teams), teams.slice(0, 16));
  assert.deepEqual(eligibleTeams("semifinals", results, teams), teams.slice(0, 8));
  assert.deepEqual(eligibleTeams("finalists", results, teams), teams.slice(0, 4));
  assert.deepEqual(eligibleTeams("champion", results, teams), teams.slice(0, 2));
});

test("changing an earlier result removes invalid downstream selections", () => {
  const results = {
    group_winners: teams.slice(0, 12),
    group_runners_up: teams.slice(12, 24),
    best_thirds: teams.slice(24, 32),
    round_of_16: [...teams.slice(0, 15), teams[40]],
    quarterfinals: [teams[0], teams[40]]
  };

  const trimmed = trimInvalidResults(results, stages, teams);
  assert.equal(trimmed.round_of_16.includes(teams[40]), false);
  assert.deepEqual(trimmed.quarterfinals, [teams[0]]);
});

test("point totals use the configured value for every correct stage pick", () => {
  const picks = {
    group_winners: ["A", "B"],
    group_runners_up: ["C"],
    best_thirds: ["D"],
    round_of_16: ["A", "C", "D"],
    quarterfinals: ["A", "C"],
    semifinals: ["A"],
    finalists: ["A"],
    champion: ["A"]
  };
  const results = {
    group_winners: ["A", "X"],
    group_runners_up: ["C"],
    best_thirds: ["D"],
    round_of_16: ["A", "C"],
    quarterfinals: ["A"],
    semifinals: ["A"],
    finalists: ["A"],
    champion: ["A"]
  };

  assert.equal(scorePrediction(picks, results, stages), 68);
});

test("database leaderboard uses the same stage point values as the browser", () => {
  const sql = fs.readFileSync(path.join(__dirname, "..", "supabase.sql"), "utf8");
  stages.forEach((stage) => {
    assert.match(sql, new RegExp(`when '${stage.id}' then ${stage.points}\\b`));
  });
});
