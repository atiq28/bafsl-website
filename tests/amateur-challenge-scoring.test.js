const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  champion,
  finalFromRecord,
  finalists,
  scorePrediction,
  totalGoals
} = require("../amateur-challenge-scoring.js");

const matches = [
  { id: 1, home: "nandonik", away: "ekattor" },
  { id: 2, home: "joddha", away: "sonar-bangla" },
  { id: 3, home: "ekattor", away: "joddha" },
  { id: 4, home: "sonar-bangla", away: "dhumketu" },
  { id: 5, home: "dhumketu", away: "nandonik" },
  { id: 6 },
  { id: 7 },
  { id: 8 }
];

test("derives finalists and champion from ranking and knockout scores", () => {
  const record = {
    groupRanking: ["nandonik", "ekattor", "joddha", "dhumketu", "sonar-bangla"],
    scores: {
      6: { home: 2, away: 0 },
      7: { home: 1, away: 3 },
      8: { home: 1, away: 2 }
    }
  };

  assert.deepEqual(finalFromRecord(record), { id: 8, home: "nandonik", away: "joddha" });
  assert.deepEqual(finalists(record), ["nandonik", "joddha"]);
  assert.equal(champion(record), "joddha");
});

test("scores exact scores, result, goal difference, bracket, champion, and bonuses", () => {
  const results = {
    groupRanking: ["nandonik", "ekattor", "joddha", "dhumketu", "sonar-bangla"],
    scores: {
      1: { home: 2, away: 1 },
      2: { home: 0, away: 0 },
      3: { home: 1, away: 3 },
      4: { home: 2, away: 2 },
      5: { home: 0, away: 2 },
      6: { home: 2, away: 0 },
      7: { home: 1, away: 3 },
      8: { home: 1, away: 2 }
    },
    topScorer: "Samuel",
    highestScoringTeam: "joddha",
    totalGoals: 24
  };
  const picks = {
    groupRanking: ["nandonik", "ekattor", "joddha", "sonar-bangla", "dhumketu"],
    scores: {
      1: { home: 2, away: 1 },
      2: { home: 1, away: 1 },
      3: { home: 0, away: 2 },
      4: { home: 1, away: 2 },
      5: { home: 0, away: 2 },
      6: { home: 2, away: 0 },
      7: { home: 1, away: 0 },
      8: { home: 1, away: 2 }
    },
    topScorer: "samuel",
    highestScoringTeam: "joddha",
    totalGoals: 25
  };

  assert.equal(scorePrediction(picks, results, matches), 90);
  assert.equal(totalGoals(results), 22);
});

test("supabase script includes amateur challenge storage, submission, and leaderboard", () => {
  const sql = fs.readFileSync(path.join(__dirname, "..", "supabase.sql"), "utf8");

  assert.match(sql, /create table if not exists public\.amateur_predictions/);
  assert.match(sql, /create table if not exists public\.amateur_results/);
  assert.match(sql, /create table if not exists public\.amateur_match_results/);
  assert.match(sql, /Public can read Amateur match results/);
  assert.match(sql, /Admins can manage Amateur match results/);
  assert.match(sql, /submit_amateur_prediction/);
  assert.match(sql, /amateur_prediction_score/);
  assert.match(sql, /create or replace view public\.amateur_leaderboard/);
});
