(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.AmateurChallengeScoring = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function toNumber(value) {
    const number = Number(value);
    return Number.isInteger(number) && number >= 0 ? number : null;
  }

  function matchScore(record, matchId) {
    const score = record?.scores?.[String(matchId)];
    const home = toNumber(score?.home);
    const away = toNumber(score?.away);
    return home === null || away === null ? null : { home, away };
  }

  function resultType(score) {
    if (!score) return "";
    if (score.home > score.away) return "home";
    if (score.away > score.home) return "away";
    return "draw";
  }

  function scoreWinner(score, match) {
    const type = resultType(score);
    if (type === "home") return match.home;
    if (type === "away") return match.away;
    return "";
  }

  function semifinalsFromRanking(ranking) {
    if (!Array.isArray(ranking) || ranking.length < 4) return [];
    return [
      { id: 6, home: ranking[0], away: ranking[3] },
      { id: 7, home: ranking[1], away: ranking[2] }
    ];
  }

  function finalFromRecord(record) {
    const semis = semifinalsFromRanking(record?.groupRanking || []);
    if (semis.length !== 2) return null;
    const finalists = semis.map((match) => scoreWinner(matchScore(record, match.id), match));
    return finalists.every(Boolean) ? { id: 8, home: finalists[0], away: finalists[1] } : null;
  }

  function finalists(record) {
    const final = finalFromRecord(record);
    return final ? [final.home, final.away] : [];
  }

  function champion(record) {
    const final = finalFromRecord(record);
    return final ? scoreWinner(matchScore(record, 8), final) : "";
  }

  function totalGoals(record, matchIds) {
    const ids = matchIds || Object.keys(record?.scores || {});
    return ids.reduce((total, id) => {
      const score = matchScore(record, id);
      return score ? total + score.home + score.away : total;
    }, 0);
  }

  function normalize(value) {
    return String(value || "").trim().toLocaleLowerCase();
  }

  function scorePrediction(picks, results, matches) {
    let total = 0;
    matches.forEach((match) => {
      const pickScore = matchScore(picks, match.id);
      const actualScore = matchScore(results, match.id);
      if (!pickScore || !actualScore) return;

      if (resultType(pickScore) === resultType(actualScore)) total += 3;
      if (pickScore.home - pickScore.away === actualScore.home - actualScore.away) total += 2;
      if (pickScore.home === actualScore.home && pickScore.away === actualScore.away) total += 5;
    });

    (results.groupRanking || []).forEach((team, index) => {
      if ((picks.groupRanking || [])[index] === team) total += 5;
    });

    const actualFinalists = new Set(finalists(results));
    finalists(picks).forEach((team) => {
      if (actualFinalists.has(team)) total += 8;
    });

    if (champion(picks) && champion(picks) === champion(results)) total += 15;

    if (normalize(picks.topScorer) && normalize(picks.topScorer) === normalize(results.topScorer)) total += 8;
    if (picks.highestScoringTeam && picks.highestScoringTeam === results.highestScoringTeam) total += 6;

    const pickedGoals = toNumber(picks.totalGoals);
    const actualGoals = toNumber(results.totalGoals);
    if (pickedGoals !== null && actualGoals !== null) {
      if (pickedGoals === actualGoals) total += 6;
      else if (Math.abs(pickedGoals - actualGoals) <= 2) total += 3;
    }

    return total;
  }

  return {
    champion,
    finalFromRecord,
    finalists,
    matchScore,
    resultType,
    scorePrediction,
    semifinalsFromRanking,
    totalGoals
  };
});
