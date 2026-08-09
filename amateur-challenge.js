const AMATEUR_LOCAL_PREDICTIONS = "bafsl-amateur-2026-predictions-v1";
const AMATEUR_LOCAL_RESULTS = "bafsl-amateur-2026-results-v1";
const AMATEUR_LOCAL_MATCH_RESULTS = "bafsl-amateur-2026-match-results-v1";
const AMATEUR_ENTRIES_OPEN = false;

const AMATEUR_TEAMS = [
  { id: "nandonik", name: "Nandonik", owner: "Tonmoy", logo: "assets/amateur-2026/logo-nandonik.png" },
  { id: "ekattor", name: "Ekattor FC", owner: "Pablo", logo: "assets/amateur-2026/logo-ekattor.png" },
  { id: "joddha", name: "Joddha", owner: "Sunny", logo: "assets/amateur-2026/logo-joddha.png" },
  { id: "sonar-bangla", name: "Sonar Bangla", owner: "Toufiq", logo: "assets/amateur-2026/logo-sonar-bangla.png" },
  { id: "dhumketu", name: "Dhumketu", owner: "Mazhar", logo: "assets/amateur-2026/logo-dhumketu.png" }
];

const AMATEUR_GROUP_MATCHES = [
  { id: 1, date: "Aug 8", time: "6:30pm - 8:10pm", venue: "FO", home: "nandonik", away: "ekattor" },
  { id: 2, date: "Aug 8", time: "8:15pm - 10:00pm", venue: "FO", home: "joddha", away: "sonar-bangla" },
  { id: 3, date: "Aug 9", time: "6:30pm - 8:10pm", venue: "Shoreline", home: "ekattor", away: "joddha" },
  { id: 4, date: "Aug 9", time: "8:15pm - 10:00pm", venue: "Shoreline", home: "sonar-bangla", away: "dhumketu" },
  { id: 5, date: "Aug 15", time: "7:00am - 9:00am", venue: "FO / Shoreline / Crittenden", home: "dhumketu", away: "nandonik" }
];

const AMATEUR_ALL_MATCHES = [
  ...AMATEUR_GROUP_MATCHES,
  { id: 6, date: "Aug 16", time: "6:10pm - 7:50pm", venue: "FO", label: "Semi-final 1" },
  { id: 7, date: "Aug 16", time: "8:00pm - 10:00pm", venue: "FO", label: "Semi-final 2" },
  { id: 8, date: "Aug 22", time: "6:00pm - 10:00pm", venue: "FO", label: "Final" }
];

const amateurPicks = {
  scores: {},
  groupRanking: [],
  topScorer: "",
  highestScoringTeam: "",
  totalGoals: ""
};
let amateurResults = loadAmateurLocalResults();
let amateurMatchResults = loadAmateurLocalMatchResults();
let amateurAdminPredictions = [];
let lastSubmittedAmateurPrediction = null;

const amateurEls = {
  section: document.querySelector("#amateur-2026"),
  challenge: document.querySelector("#amateurChallenge"),
  details: document.querySelector("#amateurChallengeDetails"),
  toggle: document.querySelector("#amateurChallengeToggle"),
  share: document.querySelector("#amateurChallengeShare"),
  form: document.querySelector("#amateurPredictionForm"),
  bracket: document.querySelector("#amateurBracket"),
  downloadPdf: document.querySelector("#amateurDownloadPdf"),
  message: document.querySelector("#amateurFormMessage"),
  leaderboard: document.querySelector("#amateurLeaderboard"),
  refresh: document.querySelector("#amateurRefresh"),
  rules: document.querySelector("#amateurRules"),
  resultForm: document.querySelector("#amateurResultForm"),
  resultInputs: document.querySelector("#amateurResultInputs"),
  resultHint: document.querySelector("#amateurResultHint"),
  adminRefresh: document.querySelector("#amateurAdminRefresh"),
  predictionSelect: document.querySelector("#amateurPredictionSelect"),
  predictionDetail: document.querySelector("#amateurPredictionDetail"),
  deletePrediction: document.querySelector("#amateurDeletePrediction"),
  matchResultForm: document.querySelector("#amateurMatchResultForm"),
  matchResultSelect: document.querySelector("#amateurMatchResultSelect")
};

if (amateurEls.challenge) initAmateurChallenge();

function teamByAmateurId(id) {
  return AMATEUR_TEAMS.find((team) => team.id === id) || { id, name: id || "TBD", owner: "", logo: "" };
}

function amateurScore(record, matchId) {
  return AmateurChallengeScoring.matchScore(record, matchId);
}

function renderAmateurPublicScores() {
  document.querySelectorAll("[data-amateur-public-match]").forEach((card) => {
    const matchId = Number(card.dataset.amateurPublicMatch);
    const match = AMATEUR_GROUP_MATCHES.find((item) => item.id === matchId);
    const result = amateurMatchResults[String(matchId)];
    const score = result && result.homeScore !== null && result.awayScore !== null
      ? { home: result.homeScore, away: result.awayScore }
      : null;
    const title = card.querySelector("strong");
    if (!match || !title) return;

    const home = teamByAmateurId(match.home).name;
    const away = teamByAmateurId(match.away).name;
    title.textContent = score
      ? `Game ${match.id}: ${home} ${score.home} - ${score.away} ${away}`
      : `Game ${match.id}: ${home} vs ${away}`;
    card.classList.toggle("has-result", Boolean(score));

    card.querySelector(".amateur-match-result-details")?.remove();
    if (!result || result.status === "upcoming") return;
    const details = document.createElement("div");
    details.className = "amateur-match-result-details";
    details.innerHTML = `
      <span class="status-pill status-${escapeAttr(result.status)}">${escapeAttr(result.status)}</span>
      ${(result.events || []).map((item) => {
        const icon = item.type === "goal" ? "⚽" : item.type === "red" ? "🟥" : "🟨";
        const assist = item.assist ? ` <small>Assist: ${escapeAttr(item.assist)}</small>` : "";
        return `<div class="amateur-result-event"><span>${icon}</span><strong>${escapeAttr(item.player)}</strong><span>${escapeAttr(teamByAmateurId(item.team).name)}</span>${assist}</div>`;
      }).join("")}
    `;
    card.append(details);
  });
}

function setAmateurChallengeOpen(open, options = {}) {
  amateurEls.details.classList.toggle("is-hidden", !open);
  amateurEls.toggle.setAttribute("aria-expanded", String(open));
  amateurEls.toggle.textContent = open ? "Close Challenge" : "Open Challenge";
  if (open && options.scroll) amateurEls.challenge.scrollIntoView({ behavior: "smooth", block: "start" });
}

function amateurShareUrl() {
  return routeUrl("?challenge=amateur-2026", "#amateur-2026");
}

async function shareAmateurChallenge() {
  const url = amateurShareUrl();
  try {
    if (navigator.share) {
      await navigator.share({
        title: "BAFSL Amateur Soccer Tournament 2026 Prediction Challenge",
        text: "Make your picks for the 8th Amateur Soccer Tournament 2026.",
        url
      });
      return;
    }
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(url);
    else fallbackCopyText(url);
    showShareToast("Challenge link copied");
  } catch (error) {
    if (error?.name !== "AbortError") window.prompt("Copy this challenge link", url);
  }
}

function loadAmateurLocalPredictions() {
  try {
    return JSON.parse(localStorage.getItem(AMATEUR_LOCAL_PREDICTIONS)) || [];
  } catch {
    return [];
  }
}

function loadAmateurLocalResults() {
  try {
    return JSON.parse(localStorage.getItem(AMATEUR_LOCAL_RESULTS)) || { scores: {}, groupRanking: [] };
  } catch {
    return { scores: {}, groupRanking: [] };
  }
}

function loadAmateurLocalMatchResults() {
  try {
    return JSON.parse(localStorage.getItem(AMATEUR_LOCAL_MATCH_RESULTS)) || {};
  } catch {
    return {};
  }
}

function saveAmateurLocalMatchResults() {
  localStorage.setItem(AMATEUR_LOCAL_MATCH_RESULTS, JSON.stringify(amateurMatchResults));
}

function parseAmateurMatchEvents(value) {
  return String(value || "").split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
    const parts = line.split(",").map((part) => part.trim());
    const type = String(parts[0] || "").toLowerCase();
    const teamName = String(parts[1] || "").toLowerCase();
    const team = AMATEUR_TEAMS.find((item) => item.id === teamName || item.name.toLowerCase() === teamName);
    if (!["goal", "yellow", "red"].includes(type) || !team || !parts[2]) return null;
    return { type, team: team.id, player: parts[2], assist: type === "goal" ? (parts[3] || "") : "" };
  }).filter(Boolean);
}

function amateurMatchEventsToText(events = []) {
  return events.map((item) => `${item.type}, ${teamByAmateurId(item.team).name}, ${item.player}${item.assist ? `, ${item.assist}` : ""}`).join("\n");
}

function populateAmateurMatchResultForm() {
  const matchId = amateurEls.matchResultSelect.value;
  const result = amateurMatchResults[matchId] || { homeScore: null, awayScore: null, status: "upcoming", events: [] };
  amateurEls.matchResultForm.elements.homeScore.value = result.homeScore ?? "";
  amateurEls.matchResultForm.elements.awayScore.value = result.awayScore ?? "";
  amateurEls.matchResultForm.elements.status.value = result.status || "upcoming";
  amateurEls.matchResultForm.elements.events.value = amateurMatchEventsToText(result.events);
}

function saveAmateurLocalResults() {
  localStorage.setItem(AMATEUR_LOCAL_RESULTS, JSON.stringify(amateurResults));
}

function knockoutMatchesFromRecord(record) {
  const semis = AmateurChallengeScoring.semifinalsFromRanking(record.groupRanking || []);
  const final = AmateurChallengeScoring.finalFromRecord(record);
  return {
    semis,
    final
  };
}

function matchForAmateurRecord(matchId, record) {
  const fixed = AMATEUR_GROUP_MATCHES.find((match) => match.id === Number(matchId));
  if (fixed) return fixed;
  const { semis, final } = knockoutMatchesFromRecord(record);
  if (Number(matchId) === 6) return semis[0] ? { ...AMATEUR_ALL_MATCHES[5], ...semis[0] } : AMATEUR_ALL_MATCHES[5];
  if (Number(matchId) === 7) return semis[1] ? { ...AMATEUR_ALL_MATCHES[6], ...semis[1] } : AMATEUR_ALL_MATCHES[6];
  if (Number(matchId) === 8) return final ? { ...AMATEUR_ALL_MATCHES[7], ...final } : AMATEUR_ALL_MATCHES[7];
  return null;
}

function renderTeamBadge(teamId) {
  const team = teamByAmateurId(teamId);
  return `
    <span class="amateur-team-badge">
      ${team.logo ? `<img src="${team.logo}" alt="" />` : ""}
      <span>${escapeAttr(team.name)}</span>
    </span>
  `;
}

function renderScoreCard(match, record, options = {}) {
  const score = amateurScore(record, match.id) || {};
  const home = teamByAmateurId(match.home);
  const away = teamByAmateurId(match.away);
  const locked = !match.home || !match.away;
  return `
    <fieldset class="amateur-score-card ${locked ? "is-locked" : ""}">
      <legend>${escapeAttr(match.label || `Game ${match.id}`)}</legend>
      <div class="amateur-match-meta">${escapeAttr(match.date || "")} &middot; ${escapeAttr(match.time || "")} &middot; ${escapeAttr(match.venue || "")}</div>
      ${locked ? `<p class="rank-meta">Complete the previous picks to unlock this match.</p>` : `
        <div class="amateur-score-row">
          ${renderTeamBadge(home.id)}
          <input data-amateur-score="${options.admin ? "result" : "pick"}" data-match-id="${match.id}" data-side="home" type="number" min="0" value="${score.home ?? ""}" aria-label="${escapeAttr(home.name)} score" />
        </div>
        <div class="amateur-score-row">
          ${renderTeamBadge(away.id)}
          <input data-amateur-score="${options.admin ? "result" : "pick"}" data-match-id="${match.id}" data-side="away" type="number" min="0" value="${score.away ?? ""}" aria-label="${escapeAttr(away.name)} score" />
        </div>
      `}
    </fieldset>
  `;
}

function syncAmateurRecordFromDom(record, root, mode) {
  if (!root?.querySelector(`[data-amateur-score="${mode}"]`)) return;
  root.querySelectorAll(`[data-amateur-score="${mode}"]`).forEach((input) => {
    const matchId = input.dataset.matchId;
    record.scores[matchId] = record.scores[matchId] || {};
    record.scores[matchId][input.dataset.side] = input.value === "" ? "" : Number(input.value);
  });
  const ranking = [...root.querySelectorAll("[data-amateur-rank]")].map((select) => select.value);
  if (ranking.length) record.groupRanking = ranking;
  const topScorer = root.querySelector('[name="amateur-top-scorer"], [name="amateur-result-top-scorer"]');
  const highestTeam = root.querySelector('[name="amateur-highest-team"], [name="amateur-result-highest-team"]');
  const totalGoals = root.querySelector('[name="amateur-total-goals"], [name="amateur-result-total-goals"]');
  if (topScorer) record.topScorer = topScorer.value;
  if (highestTeam) record.highestScoringTeam = highestTeam.value;
  if (totalGoals) record.totalGoals = totalGoals.value === "" ? "" : Number(totalGoals.value);
}

function teamOptions(selectedValue, selectedValues = []) {
  return AMATEUR_TEAMS.map((team) => {
    const used = selectedValues.includes(team.id) && team.id !== selectedValue;
    return `<option value="${team.id}" ${team.id === selectedValue ? "selected" : ""} ${used ? "disabled" : ""}>${escapeAttr(team.name)}</option>`;
  }).join("");
}

function renderRankingSelects(record, prefix, label = "Final Group Ranking") {
  const selectedValues = (record.groupRanking || []).filter(Boolean);
  return `
    <section class="world-cup-pick-stage">
      <div class="world-cup-stage-heading">
        <div><span class="mini-label">${escapeAttr(prefix)}</span><h3>${escapeAttr(label)}</h3></div>
        <p>Each team can appear only once.</p>
      </div>
      <div class="amateur-rank-grid">
        ${AMATEUR_TEAMS.map((_, index) => {
          const value = record.groupRanking?.[index] || "";
          return `
            <label>
              Rank ${index + 1}
              <select data-amateur-rank="${index}">
                <option value="">Select team</option>
                ${teamOptions(value, selectedValues)}
              </select>
            </label>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function renderAmateurBracket() {
  syncAmateurRecordFromDom(amateurPicks, amateurEls.bracket, "pick");
  const { semis, final } = knockoutMatchesFromRecord(amateurPicks);
  amateurEls.bracket.innerHTML = `
    <section>
      <div class="world-cup-stage-heading">
        <div><span class="mini-label">Step 1</span><h3>Predict Group Match Scores</h3></div>
        <p>Correct result, goal difference, and exact score each earn points.</p>
      </div>
      <div class="amateur-pick-grid">
        ${AMATEUR_GROUP_MATCHES.map((match) => renderScoreCard(match, amateurPicks)).join("")}
      </div>
    </section>
    ${renderRankingSelects(amateurPicks, "Step 2")}
    <section class="world-cup-pick-stage">
      <div class="world-cup-stage-heading">
        <div><span class="mini-label">Step 3</span><h3>Predict Semi-final Scores</h3></div>
        <p>Based on your ranking: Rank 1 vs Rank 4 and Rank 2 vs Rank 3.</p>
      </div>
      <div class="amateur-pick-grid">
        ${[6, 7].map((id, index) => renderScoreCard(semis[index] ? { ...AMATEUR_ALL_MATCHES[id - 1], ...semis[index] } : AMATEUR_ALL_MATCHES[id - 1], amateurPicks)).join("")}
      </div>
    </section>
    <section class="world-cup-pick-stage">
      <div class="world-cup-stage-heading">
        <div><span class="mini-label">Step 4</span><h3>Predict Final Score and Champion</h3></div>
        <p>The final opens after your semi-final winners are clear.</p>
      </div>
      <div class="amateur-pick-grid">
        ${renderScoreCard(final ? { ...AMATEUR_ALL_MATCHES[7], ...final } : AMATEUR_ALL_MATCHES[7], amateurPicks)}
      </div>
    </section>
    <section class="world-cup-pick-stage">
      <div class="world-cup-stage-heading">
        <div><span class="mini-label">Step 5</span><h3>Bonus Predictions</h3></div>
        <p>These make the leaderboard more fun when the table gets tight.</p>
      </div>
      <div class="amateur-bonus-grid">
        <label>
          Top Scorer
          <input name="amateur-top-scorer" value="${escapeAttr(amateurPicks.topScorer)}" placeholder="Player name" />
        </label>
        <label>
          Highest-scoring Team
          <select name="amateur-highest-team">
            <option value="">Select team</option>
            ${AMATEUR_TEAMS.map((team) => `<option value="${team.id}" ${team.id === amateurPicks.highestScoringTeam ? "selected" : ""}>${escapeAttr(team.name)}</option>`).join("")}
          </select>
        </label>
        <label>
          Total Tournament Goals
          <input name="amateur-total-goals" type="number" min="0" value="${amateurPicks.totalGoals ?? ""}" />
        </label>
      </div>
    </section>
  `;
}

function updateAmateurScore(input, record) {
  const matchId = input.dataset.matchId;
  record.scores[matchId] = record.scores[matchId] || {};
  record.scores[matchId][input.dataset.side] = input.value === "" ? "" : Number(input.value);
  if (Number(matchId) === 6 || Number(matchId) === 7) delete record.scores[8];
}

function updateAmateurRank(select, record) {
  const index = Number(select.dataset.amateurRank);
  const duplicate = (record.groupRanking || []).some((team, teamIndex) => team && team === select.value && teamIndex !== index);
  if (duplicate) {
    select.value = "";
    amateurEls.message.textContent = "Each team can only be used once in the ranking.";
  }
  record.groupRanking[index] = select.value;
  record.groupRanking = record.groupRanking.slice(0, AMATEUR_TEAMS.length);
  delete record.scores[6];
  delete record.scores[7];
  delete record.scores[8];
}

function handleAmateurScoreProgress(event, record, mode, render) {
  const scoreInput = event.target.closest(`[data-amateur-score="${mode}"]`);
  if (!scoreInput) return false;
  updateAmateurScore(scoreInput, record);
  if (Number(scoreInput.dataset.matchId) >= 6 && amateurScore(record, scoreInput.dataset.matchId)) window.setTimeout(render, 0);
  return true;
}

function validateAmateurPrediction(record) {
  const ranking = record.groupRanking || [];
  if (ranking.length !== AMATEUR_TEAMS.length || ranking.some((team) => !team)) return "Complete the full group ranking.";
  if (new Set(ranking).size !== AMATEUR_TEAMS.length) return "Each team can only appear once in the group ranking.";
  for (const match of AMATEUR_ALL_MATCHES) {
    const resolved = matchForAmateurRecord(match.id, record);
    if (!resolved?.home || !resolved?.away) return `Complete the teams for Game ${match.id}.`;
    const score = amateurScore(record, match.id);
    if (!score) return `Enter the predicted score for Game ${match.id}.`;
    if (match.id >= 6 && score.home === score.away) return `Game ${match.id} needs a winner. Please avoid a tied knockout score.`;
  }
  if (!String(record.topScorer || "").trim()) return "Enter your top scorer prediction.";
  if (!record.highestScoringTeam) return "Choose the highest-scoring team.";
  if (String(record.totalGoals ?? "").trim() === "" || Number(record.totalGoals) < 0 || !Number.isInteger(Number(record.totalGoals))) return "Enter the total tournament goals.";
  return "";
}

function normalizeAmateurIdentity(value) {
  return String(value || "").trim().toLocaleLowerCase();
}

function submissionAmateurPicks() {
  return {
    scores: structuredClone(amateurPicks.scores),
    groupRanking: [...amateurPicks.groupRanking],
    topScorer: String(amateurPicks.topScorer || "").trim(),
    highestScoringTeam: amateurPicks.highestScoringTeam,
    totalGoals: Number(amateurPicks.totalGoals)
  };
}

async function submitAmateurPrediction(name, email, picks) {
  if (!AMATEUR_ENTRIES_OPEN) throw new Error("Amateur challenge entries are closed.");

  const saveLocal = () => {
    const predictions = loadAmateurLocalPredictions();
    const normalizedName = normalizeAmateurIdentity(name);
    const normalizedEmail = normalizeAmateurIdentity(email);
    if (predictions.some((entry) => normalizeAmateurIdentity(entry.name) === normalizedName)) throw new Error("That name has already been used.");
    if (predictions.some((entry) => normalizeAmateurIdentity(entry.email) === normalizedEmail)) throw new Error("That email address has already been used.");
    const savedPrediction = { id: crypto.randomUUID(), name, email, picks, submitted_at: new Date().toISOString() };
    predictions.push(savedPrediction);
    localStorage.setItem(AMATEUR_LOCAL_PREDICTIONS, JSON.stringify(predictions));
    return savedPrediction;
  };

  if (!remoteConfigured()) return saveLocal();
  const response = await fetch(`${REMOTE_CONFIG.supabaseUrl.replace(/\/$/, "")}/rest/v1/rpc/submit_amateur_prediction`, {
    method: "POST",
    headers: remoteHeaders(),
    body: JSON.stringify({
      participant_name: name,
      participant_email: email,
      participant_picks: picks
    })
  });
  if (!response.ok) {
    if (response.status === 404) return saveLocal();
    const error = await response.json().catch(() => ({}));
    const message = String(error.message || "");
    if (message.includes("name has already")) throw new Error("That name has already been used.");
    if (message.includes("email address has already")) throw new Error("That email address has already been used.");
    if (message.includes("duplicate key")) throw new Error("That name or email address has already been used.");
    throw new Error(message || "Prediction could not be submitted.");
  }
  const id = await response.json();
  return { id, name, email, picks, submitted_at: new Date().toISOString() };
}

async function createAmateurPredictionPdf(prediction) {
  const { PDFDocument, StandardFonts, rgb } = PDFLib;
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const logoBytes = await fetch("assets/bafsl-logo.png").then((response) => response.arrayBuffer());
  const logo = await pdf.embedPng(logoBytes);
  const page = pdf.addPage([612, 792]);
  const green = rgb(0.047, 0.31, 0.267);
  const yellow = rgb(0.941, 0.706, 0.161);
  const ink = rgb(0.071, 0.125, 0.114);
  const pale = rgb(0.957, 0.969, 0.961);
  const muted = rgb(0.38, 0.44, 0.42);
  const text = (value) => String(value ?? "-").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, "?");
  let y = 736;

  page.drawRectangle({ x: 0, y: 708, width: 612, height: 84, color: green });
  page.drawImage(logo, { x: 38, y: 724, width: 50, height: 50 });
  page.drawText("BAFSL", { x: 102, y: 756, size: 20, font: bold, color: rgb(1, 1, 1) });
  page.drawText("8th Amateur Soccer Tournament 2026", { x: 102, y: 736, size: 13, font: bold, color: yellow });
  page.drawText("Official Prediction Record", { x: 38, y: 680, size: 24, font: bold, color: ink });
  page.drawRectangle({ x: 38, y: 664, width: 90, height: 5, color: yellow });

  page.drawRectangle({ x: 38, y: 590, width: 536, height: 54, color: pale });
  page.drawText(text(prediction.name), { x: 54, y: 621, size: 18, font: bold, color: ink });
  page.drawText(`${text(prediction.email)}  |  Submitted ${new Date(prediction.submitted_at).toLocaleString()}`, { x: 54, y: 602, size: 9, font: regular, color: muted });
  y = 560;

  const heading = (label) => {
    page.drawRectangle({ x: 38, y: y - 2, width: 536, height: 22, color: green });
    page.drawText(label.toUpperCase(), { x: 48, y: y + 5, size: 10, font: bold, color: rgb(1, 1, 1) });
    y -= 34;
  };
  const line = (left, right, shade = false) => {
    if (shade) page.drawRectangle({ x: 38, y: y - 5, width: 536, height: 20, color: pale });
    page.drawText(text(left), { x: 48, y, size: 9, font: bold, color: green, maxWidth: 240 });
    page.drawText(text(right), { x: 278, y, size: 9, font: regular, color: ink, maxWidth: 280 });
    y -= 22;
  };

  heading("Match Score Predictions");
  AMATEUR_ALL_MATCHES.forEach((base, index) => {
    const match = matchForAmateurRecord(base.id, prediction.picks) || base;
    const score = amateurScore(prediction.picks, base.id);
    const left = `Game ${base.id}: ${teamByAmateurId(match.home).name} vs ${teamByAmateurId(match.away).name}`;
    const winner = score && base.id >= 6 ? `, winner: ${teamByAmateurId(score.home > score.away ? match.home : match.away).name}` : "";
    line(left, score ? `${score.home} - ${score.away}${winner}` : "No score", index % 2 === 0);
  });

  y -= 6;
  heading("Group Ranking and Bonuses");
  line("Final group ranking", (prediction.picks.groupRanking || []).map((id, index) => `${index + 1}. ${teamByAmateurId(id).name}`).join("   "));
  line("Predicted champion", teamByAmateurId(AmateurChallengeScoring.champion(prediction.picks)).name);
  line("Top scorer", prediction.picks.topScorer);
  line("Highest-scoring team", teamByAmateurId(prediction.picks.highestScoringTeam).name);
  line("Total tournament goals", prediction.picks.totalGoals);

  page.drawText("BAFSL.COM  |  AMATEUR 2026 PREDICTION CHALLENGE", { x: 38, y: 22, size: 8, font: bold, color: muted });
  return new Blob([await pdf.save()], { type: "application/pdf" });
}

async function downloadAmateurPredictionPdf(prediction) {
  if (!prediction) return;
  const blob = await createAmateurPredictionPdf(prediction);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `amateur-2026-prediction-${slugify(prediction.name)}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function scoreAmateurPrediction(picks) {
  return AmateurChallengeScoring.scorePrediction(picks, amateurResults, AMATEUR_ALL_MATCHES);
}

async function loadAmateurLeaderboard() {
  amateurEls.leaderboard.innerHTML = `<p class="rank-meta">Loading leaderboard...</p>`;
  try {
    let rows;
    if (remoteConfigured()) {
      const response = await fetch(`${REMOTE_CONFIG.supabaseUrl.replace(/\/$/, "")}/rest/v1/amateur_leaderboard?select=id,name,score,submitted_at&order=score.desc,submitted_at.asc`, {
        headers: remoteHeaders()
      });
      if (response.ok) rows = await response.json();
      else if (response.status === 404) rows = null;
      else throw new Error("Leaderboard unavailable.");
    }
    rows = rows || loadAmateurLocalPredictions()
      .map((entry) => ({ ...entry, score: scoreAmateurPrediction(entry.picks) }))
      .sort((a, b) => b.score - a.score || a.submitted_at.localeCompare(b.submitted_at));
    amateurEls.leaderboard.innerHTML = rows.length ? rows.map((entry, index) => `
      <div class="world-cup-leader-row">
        <span class="world-cup-rank">${index + 1}</span>
        <div><strong>${escapeAttr(entry.name)}</strong><span>Prediction submitted ${new Date(entry.submitted_at).toLocaleDateString()}</span></div>
        <strong class="world-cup-score">${entry.score} pts</strong>
      </div>
    `).join("") : `<p class="rank-meta">No predictions submitted yet.</p>`;
  } catch {
    amateurEls.leaderboard.innerHTML = `<p class="rank-meta">The leaderboard will appear after the Amateur challenge database update is installed.</p>`;
  }
}

function renderAmateurRules() {
  amateurEls.rules.innerHTML = `
    <div class="world-cup-rule-card"><strong>10 pts</strong><p>Exact score for any match: 5 points, correct goal difference: 2 points, correct result/winner: 3 points.</p></div>
    <div class="world-cup-rule-card"><strong>5 pts</strong><p>For each team placed in the correct final group ranking position.</p></div>
    <div class="world-cup-rule-card"><strong>8 pts</strong><p>For each correct finalist, plus 15 points for the champion.</p></div>
    <div class="world-cup-rule-card"><strong>Bonus</strong><p>Top scorer: 8 points. Highest-scoring team: 6 points. Total goals: 6 exact, 3 within two goals.</p></div>
    <div class="world-cup-rule-card"><strong>Ties</strong><p>The earliest submitted prediction ranks higher when total points are tied.</p></div>
  `;
}

function renderAmateurResultInputs() {
  syncAmateurRecordFromDom(amateurResults, amateurEls.resultInputs, "result");
  const { semis, final } = knockoutMatchesFromRecord(amateurResults);
  amateurEls.resultInputs.innerHTML = `
    <div class="amateur-pick-grid">
      ${AMATEUR_GROUP_MATCHES.map((match) => renderScoreCard(match, amateurResults, { admin: true })).join("")}
    </div>
    ${renderRankingSelects(amateurResults, "Admin", "Actual Group Ranking")}
    <section class="world-cup-pick-stage">
      <div class="world-cup-stage-heading">
        <div><span class="mini-label">Admin</span><h3>Actual Knockout Scores</h3></div>
        <p>Semi-final fixtures come from the saved actual group ranking.</p>
      </div>
      <div class="amateur-pick-grid">
        ${[6, 7].map((id, index) => renderScoreCard(semis[index] ? { ...AMATEUR_ALL_MATCHES[id - 1], ...semis[index] } : AMATEUR_ALL_MATCHES[id - 1], amateurResults, { admin: true })).join("")}
        ${renderScoreCard(final ? { ...AMATEUR_ALL_MATCHES[7], ...final } : AMATEUR_ALL_MATCHES[7], amateurResults, { admin: true })}
      </div>
    </section>
    <section class="world-cup-pick-stage">
      <div class="world-cup-stage-heading">
        <div><span class="mini-label">Admin</span><h3>Actual Bonuses</h3></div>
        <p>These fields update the final leaderboard.</p>
      </div>
      <div class="amateur-bonus-grid">
        <label>Top Scorer<input name="amateur-result-top-scorer" value="${escapeAttr(amateurResults.topScorer || "")}" /></label>
        <label>Highest-scoring Team<select name="amateur-result-highest-team"><option value="">Select team</option>${AMATEUR_TEAMS.map((team) => `<option value="${team.id}" ${team.id === amateurResults.highestScoringTeam ? "selected" : ""}>${escapeAttr(team.name)}</option>`).join("")}</select></label>
        <label>Total Tournament Goals<input name="amateur-result-total-goals" type="number" min="0" value="${amateurResults.totalGoals ?? ""}" /></label>
      </div>
    </section>
  `;
  amateurEls.resultHint.textContent = "Group ranking dropdowns hide teams already selected in other ranking positions.";
}

function renderAmateurAdminPrediction() {
  const prediction = amateurAdminPredictions.find((entry) => entry.id === amateurEls.predictionSelect.value);
  if (!prediction) {
    amateurEls.deletePrediction.disabled = true;
    amateurEls.predictionDetail.innerHTML = `<p class="rank-meta">Choose a participant to see their complete prediction.</p>`;
    return;
  }
  amateurEls.deletePrediction.disabled = false;
  amateurEls.predictionDetail.innerHTML = `
    <div class="world-cup-admin-person">
      <strong>${escapeAttr(prediction.name)}</strong>
      <span>${escapeAttr(prediction.email)}</span>
      <span>Submitted ${new Date(prediction.submitted_at).toLocaleString()}</span>
      <span>Current score: ${scoreAmateurPrediction(prediction.picks)} pts</span>
    </div>
    <div class="world-cup-admin-pick-list">
      <div><strong>Group Ranking</strong><span>${(prediction.picks.groupRanking || []).map((id, index) => `${index + 1}. ${escapeAttr(teamByAmateurId(id).name)}`).join("<br />")}</span></div>
      <div><strong>Match Scores</strong><span>${AMATEUR_ALL_MATCHES.map((base) => {
        const match = matchForAmateurRecord(base.id, prediction.picks) || base;
        const score = amateurScore(prediction.picks, base.id);
        return `Game ${base.id}: ${escapeAttr(teamByAmateurId(match.home).name)} vs ${escapeAttr(teamByAmateurId(match.away).name)} -> ${score ? `${score.home}-${score.away}` : "No score"}`;
      }).join("<br />")}</span></div>
      <div><strong>Bonuses</strong><span>Top scorer: ${escapeAttr(prediction.picks.topScorer || "-")}<br />Highest-scoring team: ${escapeAttr(teamByAmateurId(prediction.picks.highestScoringTeam).name)}<br />Total goals: ${escapeAttr(prediction.picks.totalGoals)}</span></div>
    </div>
  `;
}

async function loadAmateurAdminPredictions() {
  amateurEls.predictionDetail.innerHTML = `<p class="rank-meta">Loading submitted predictions...</p>`;
  try {
    if (remoteConfigured() && remoteAccessToken) {
      const response = await fetch(`${REMOTE_CONFIG.supabaseUrl.replace(/\/$/, "")}/rest/v1/amateur_predictions?select=id,name,email,picks,submitted_at&order=submitted_at.desc`, {
        headers: remoteHeaders({ Authorization: `Bearer ${remoteAccessToken}` })
      });
      if (!response.ok) throw new Error("Predictions could not be loaded.");
      amateurAdminPredictions = await response.json();
    } else {
      amateurAdminPredictions = loadAmateurLocalPredictions().sort((a, b) => b.submitted_at.localeCompare(a.submitted_at));
    }
    amateurEls.predictionSelect.innerHTML = amateurAdminPredictions.length
      ? amateurAdminPredictions.map((entry) => `<option value="${entry.id}">${escapeAttr(entry.name)} - ${escapeAttr(entry.email)}</option>`).join("")
      : `<option value="">No predictions submitted</option>`;
    renderAmateurAdminPrediction();
  } catch {
    amateurEls.predictionSelect.innerHTML = `<option value="">Predictions unavailable</option>`;
    amateurEls.predictionDetail.innerHTML = `<p class="rank-meta">Sign in as a Supabase admin and install the updated database script to view private predictions.</p>`;
  }
}

async function deleteAmateurPrediction() {
  const prediction = amateurAdminPredictions.find((entry) => entry.id === amateurEls.predictionSelect.value);
  if (!prediction) return;
  if (!window.confirm(`Delete the Amateur challenge entry for ${prediction.name}? This cannot be undone.`)) return;
  try {
    if (remoteConfigured() && remoteAccessToken) {
      const response = await fetch(`${REMOTE_CONFIG.supabaseUrl.replace(/\/$/, "")}/rest/v1/amateur_predictions?id=eq.${encodeURIComponent(prediction.id)}`, {
        method: "DELETE",
        headers: remoteHeaders({ Authorization: `Bearer ${remoteAccessToken}`, Prefer: "return=minimal" })
      });
      if (!response.ok) throw new Error("Entry could not be deleted.");
    } else {
      localStorage.setItem(AMATEUR_LOCAL_PREDICTIONS, JSON.stringify(loadAmateurLocalPredictions().filter((entry) => entry.id !== prediction.id)));
    }
    els.adminMessage.textContent = `${prediction.name}'s Amateur challenge entry was deleted.`;
    await loadAmateurAdminPredictions();
    await loadAmateurLeaderboard();
  } catch (error) {
    els.adminMessage.textContent = error.message || "Entry could not be deleted.";
  }
}

async function saveAmateurRemoteResults() {
  if (!remoteConfigured() || !remoteAccessToken) return false;
  const response = await fetch(`${REMOTE_CONFIG.supabaseUrl.replace(/\/$/, "")}/rest/v1/amateur_results`, {
    method: "POST",
    headers: remoteHeaders({ Authorization: `Bearer ${remoteAccessToken}`, Prefer: "resolution=merge-duplicates,return=minimal" }),
    body: JSON.stringify({ id: "official", data: amateurResults })
  });
  if (!response.ok) throw new Error("Amateur results could not be saved.");
  return true;
}

async function loadAmateurRemoteResults() {
  if (!remoteConfigured()) return;
  try {
    const response = await fetch(`${REMOTE_CONFIG.supabaseUrl.replace(/\/$/, "")}/rest/v1/amateur_results?id=eq.official&select=data`, {
      headers: remoteHeaders()
    });
    if (!response.ok) return;
    const rows = await response.json();
    if (rows[0]?.data) {
      amateurResults = rows[0].data;
      saveAmateurLocalResults();
      renderAmateurPublicScores();
      renderAmateurResultInputs();
      loadAmateurLeaderboard();
    }
  } catch {
    // Local results remain available until Supabase is updated.
  }
}

async function saveAmateurRemoteMatchResult(matchId, result) {
  if (!remoteConfigured() || !remoteAccessToken) return false;
  const response = await fetch(`${REMOTE_CONFIG.supabaseUrl.replace(/\/$/, "")}/rest/v1/amateur_match_results`, {
    method: "POST",
    headers: remoteHeaders({ Authorization: `Bearer ${remoteAccessToken}`, Prefer: "resolution=merge-duplicates,return=minimal" }),
    body: JSON.stringify({ match_id: Number(matchId), ...result })
  });
  if (!response.ok) throw new Error("Amateur match result could not be saved.");
  return true;
}

async function loadAmateurRemoteMatchResults() {
  if (!remoteConfigured()) return;
  try {
    const response = await fetch(`${REMOTE_CONFIG.supabaseUrl.replace(/\/$/, "")}/rest/v1/amateur_match_results?select=match_id,home_score,away_score,status,events`, { headers: remoteHeaders() });
    if (!response.ok) return;
    const rows = await response.json();
    amateurMatchResults = Object.fromEntries(rows.map((row) => [String(row.match_id), {
      homeScore: row.home_score,
      awayScore: row.away_score,
      status: row.status,
      events: row.events || []
    }]));
    saveAmateurLocalMatchResults();
    renderAmateurPublicScores();
    populateAmateurMatchResultForm();
  } catch {
    // Keep locally cached match details available if the live service is unavailable.
  }
}

function initAmateurChallenge() {
  amateurEls.toggle.addEventListener("click", () => setAmateurChallengeOpen(amateurEls.details.classList.contains("is-hidden")));
  amateurEls.share.addEventListener("click", shareAmateurChallenge);
  amateurEls.refresh.addEventListener("click", loadAmateurLeaderboard);
  amateurEls.downloadPdf.addEventListener("click", () => downloadAmateurPredictionPdf(lastSubmittedAmateurPrediction));
  amateurEls.adminRefresh.addEventListener("click", loadAmateurAdminPredictions);
  amateurEls.predictionSelect.addEventListener("change", renderAmateurAdminPrediction);
  amateurEls.deletePrediction.addEventListener("click", deleteAmateurPrediction);
  amateurEls.matchResultSelect.innerHTML = AMATEUR_GROUP_MATCHES.map((match) => `<option value="${match.id}">Game ${match.id}: ${escapeAttr(teamByAmateurId(match.home).name)} vs ${escapeAttr(teamByAmateurId(match.away).name)}</option>`).join("");
  amateurEls.matchResultSelect.addEventListener("change", populateAmateurMatchResultForm);
  amateurEls.matchResultForm.elements.status.addEventListener("change", () => {
    if (amateurEls.matchResultForm.elements.status.value !== "upcoming") return;
    amateurEls.matchResultForm.elements.homeScore.value = "";
    amateurEls.matchResultForm.elements.awayScore.value = "";
    amateurEls.matchResultForm.elements.events.value = "";
  });
  amateurEls.matchResultForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const matchId = String(form.get("matchId"));
    const status = String(form.get("status"));
    const result = status === "upcoming"
      ? { homeScore: null, awayScore: null, status, events: [] }
      : {
          homeScore: form.get("homeScore") === "" ? 0 : Number(form.get("homeScore")),
          awayScore: form.get("awayScore") === "" ? 0 : Number(form.get("awayScore")),
          status,
          events: parseAmateurMatchEvents(form.get("events"))
        };
    amateurMatchResults[matchId] = result;
    saveAmateurLocalMatchResults();
    renderAmateurPublicScores();
    try {
      const synced = await saveAmateurRemoteMatchResult(matchId, {
        home_score: result.homeScore,
        away_score: result.awayScore,
        status: result.status,
        events: result.events
      });
      els.adminMessage.textContent = synced ? "Amateur score and match details updated." : "Amateur match saved in this browser. Sign in to sync it live.";
    } catch {
      els.adminMessage.textContent = "Amateur match saved locally, but the live update failed.";
    }
  });

  amateurEls.details.querySelector(".world-cup-tabs")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-amateur-view]");
    if (!button) return;
    amateurEls.details.querySelectorAll("[data-amateur-view]").forEach((tab) => tab.classList.toggle("is-active", tab === button));
    amateurEls.details.querySelectorAll("[data-amateur-panel]").forEach((panel) => {
      panel.classList.toggle("is-hidden", panel.dataset.amateurPanel !== button.dataset.amateurView);
    });
    if (button.dataset.amateurView === "leaderboard") loadAmateurLeaderboard();
  });

  amateurEls.bracket.addEventListener("input", (event) => {
    const scoreInput = event.target.closest('[data-amateur-score="pick"]');
    if (scoreInput) {
      updateAmateurScore(scoreInput, amateurPicks);
      if (Number(scoreInput.dataset.matchId) >= 6 && amateurScore(amateurPicks, scoreInput.dataset.matchId)) window.setTimeout(renderAmateurBracket, 0);
      return;
    }
    if (event.target.name === "amateur-top-scorer") amateurPicks.topScorer = event.target.value;
    if (event.target.name === "amateur-total-goals") amateurPicks.totalGoals = event.target.value;
  });
  amateurEls.bracket.addEventListener("keyup", (event) => handleAmateurScoreProgress(event, amateurPicks, "pick", renderAmateurBracket));
  amateurEls.bracket.addEventListener("focusout", (event) => handleAmateurScoreProgress(event, amateurPicks, "pick", renderAmateurBracket));

  amateurEls.bracket.addEventListener("change", (event) => {
    const rankSelect = event.target.closest("[data-amateur-rank]");
    if (rankSelect) {
      updateAmateurRank(rankSelect, amateurPicks);
      window.setTimeout(renderAmateurBracket, 0);
      return;
    }
    const scoreInput = event.target.closest('[data-amateur-score="pick"]');
    if (scoreInput) {
      updateAmateurScore(scoreInput, amateurPicks);
      if (Number(scoreInput.dataset.matchId) >= 6) window.setTimeout(renderAmateurBracket, 0);
      return;
    }
    if (event.target.name === "amateur-highest-team") amateurPicks.highestScoringTeam = event.target.value;
  });

  amateurEls.form.addEventListener("submit", async (event) => {
    event.preventDefault();
    syncAmateurRecordFromDom(amateurPicks, amateurEls.bracket, "pick");
    const validation = validateAmateurPrediction(amateurPicks);
    if (validation) {
      amateurEls.message.textContent = validation;
      return;
    }
    const form = new FormData(event.currentTarget);
    const submitButton = event.currentTarget.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    amateurEls.downloadPdf.classList.add("is-hidden");
    amateurEls.message.textContent = "Submitting your prediction...";
    try {
      lastSubmittedAmateurPrediction = await submitAmateurPrediction(
        String(form.get("name")).trim(),
        String(form.get("email")).trim(),
        submissionAmateurPicks()
      );
      amateurEls.message.textContent = "Your prediction is in. Download the PDF for your records.";
      amateurEls.downloadPdf.classList.remove("is-hidden");
      await loadAmateurLeaderboard();
    } catch (error) {
      amateurEls.message.textContent = error.message || "Your prediction could not be submitted. Please try again.";
    } finally {
      submitButton.disabled = !AMATEUR_ENTRIES_OPEN;
    }
  });

  amateurEls.resultInputs.addEventListener("input", (event) => {
    const scoreInput = event.target.closest('[data-amateur-score="result"]');
    if (scoreInput) {
      updateAmateurScore(scoreInput, amateurResults);
      if (Number(scoreInput.dataset.matchId) >= 6 && amateurScore(amateurResults, scoreInput.dataset.matchId)) window.setTimeout(renderAmateurResultInputs, 0);
      return;
    }
    if (event.target.name === "amateur-result-top-scorer") amateurResults.topScorer = event.target.value;
    if (event.target.name === "amateur-result-total-goals") amateurResults.totalGoals = event.target.value === "" ? "" : Number(event.target.value);
  });
  amateurEls.resultInputs.addEventListener("keyup", (event) => handleAmateurScoreProgress(event, amateurResults, "result", renderAmateurResultInputs));
  amateurEls.resultInputs.addEventListener("focusout", (event) => handleAmateurScoreProgress(event, amateurResults, "result", renderAmateurResultInputs));

  amateurEls.resultInputs.addEventListener("change", (event) => {
    const rankSelect = event.target.closest("[data-amateur-rank]");
    if (rankSelect) {
      updateAmateurRank(rankSelect, amateurResults);
      saveAmateurLocalResults();
      window.setTimeout(renderAmateurResultInputs, 0);
      return;
    }
    const scoreInput = event.target.closest('[data-amateur-score="result"]');
    if (scoreInput) {
      updateAmateurScore(scoreInput, amateurResults);
      if (Number(scoreInput.dataset.matchId) >= 6) window.setTimeout(renderAmateurResultInputs, 0);
      return;
    }
    if (event.target.name === "amateur-result-highest-team") amateurResults.highestScoringTeam = event.target.value;
  });

  amateurEls.resultForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    saveAmateurLocalResults();
    try {
      const synced = await saveAmateurRemoteResults();
      els.adminMessage.textContent = synced ? "Amateur results saved and leaderboard updated." : "Amateur results saved in this browser. Sign in to sync them live.";
    } catch {
      els.adminMessage.textContent = "Results saved locally, but the live update failed.";
    }
    renderAmateurPublicScores();
    renderAmateurResultInputs();
    loadAmateurLeaderboard();
  });

  document.querySelector(".admin-tabs")?.addEventListener("click", (event) => {
    if (event.target.closest('[data-admin-view="amateur"]')) loadAmateurAdminPredictions();
  });
  document.addEventListener("bafsl-admin-login", loadAmateurAdminPredictions);

  renderAmateurBracket();
  renderAmateurPublicScores();
  populateAmateurMatchResultForm();
  renderAmateurRules();
  renderAmateurResultInputs();
  loadAmateurRemoteResults();
  loadAmateurRemoteMatchResults();
  loadAmateurLeaderboard();
  if (new URLSearchParams(window.location.search).get("challenge") === "amateur-2026") {
    setAmateurChallengeOpen(true, { scroll: true });
  }
  const submitButton = amateurEls.form.querySelector('button[type="submit"]');
  submitButton.disabled = !AMATEUR_ENTRIES_OPEN;
  if (!AMATEUR_ENTRIES_OPEN) amateurEls.message.textContent = "Amateur challenge entries are closed. Existing entries remain on the leaderboard.";
}
