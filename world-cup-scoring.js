(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.WorldCupScoring = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function eligibleTeams(stageId, results, allTeams) {
    const previousStage = {
      group_winners: null,
      group_runners_up: null,
      best_thirds: null,
      round_of_16: null,
      quarterfinals: "round_of_16",
      semifinals: "quarterfinals",
      finalists: "semifinals",
      champion: "finalists"
    };

    if (stageId === "group_winners") return [...allTeams];
    if (stageId === "group_runners_up") {
      const winners = new Set(results.group_winners || []);
      return allTeams.filter((team) => !winners.has(team));
    }
    if (stageId === "best_thirds") {
      const topTwo = new Set([...(results.group_winners || []), ...(results.group_runners_up || [])]);
      return allTeams.filter((team) => !topTwo.has(team));
    }
    if (stageId === "round_of_16") {
      return [...new Set([
        ...(results.group_winners || []),
        ...(results.group_runners_up || []),
        ...(results.best_thirds || [])
      ])];
    }

    return [...(results[previousStage[stageId]] || [])];
  }

  function trimInvalidResults(results, stages, allTeams) {
    const trimmed = Object.fromEntries(
      Object.entries(results || {}).map(([stageId, teams]) => [stageId, [...(teams || [])]])
    );
    stages.forEach((stage) => {
      const eligible = new Set(eligibleTeams(stage.id, trimmed, allTeams));
      trimmed[stage.id] = (trimmed[stage.id] || [])
        .filter((team) => eligible.has(team))
        .slice(0, stage.count);
    });
    return trimmed;
  }

  function scorePrediction(picks, results, stages) {
    return stages.reduce((total, stage) => {
      const actual = new Set(results[stage.id] || []);
      const correct = (picks[stage.id] || []).filter((team) => actual.has(team)).length;
      return total + correct * stage.points;
    }, 0);
  }

  return { eligibleTeams, trimInvalidResults, scorePrediction };
});
