const WORLD_CUP_LOCAL_PREDICTIONS = "bafsl-world-cup-predictions-v1";
const WORLD_CUP_LOCAL_RESULTS = "bafsl-world-cup-results-v1";
const WORLD_CUP_ENTRY_DEADLINE = new Date("2026-06-11T00:00:00-07:00");

const WORLD_CUP_GROUPS = {
  A: ["Mexico", "South Africa", "Korea Republic", "Czechia"],
  B: ["Canada", "Bosnia and Herzegovina", "Qatar", "Switzerland"],
  C: ["Brazil", "Morocco", "Haiti", "Scotland"],
  D: ["USA", "Paraguay", "Australia", "Türkiye"],
  E: ["Germany", "Curaçao", "Côte d'Ivoire", "Ecuador"],
  F: ["Netherlands", "Japan", "Sweden", "Tunisia"],
  G: ["Belgium", "Egypt", "IR Iran", "New Zealand"],
  H: ["Spain", "Cabo Verde", "Saudi Arabia", "Uruguay"],
  I: ["France", "Senegal", "Iraq", "Norway"],
  J: ["Argentina", "Algeria", "Austria", "Jordan"],
  K: ["Portugal", "Congo DR", "Uzbekistan", "Colombia"],
  L: ["England", "Croatia", "Ghana", "Panama"]
};

const WORLD_CUP_STAGES = [
  { id: "group_winners", label: "Group Winners", count: 12, points: 2, source: "groups" },
  { id: "group_runners_up", label: "Group Runners-up", count: 12, points: 1, source: "groups" },
  { id: "best_thirds", label: "Best Third-place Teams", count: 8, points: 1, source: "thirds" },
  { id: "round_of_16", label: "Reach the Round of 16", count: 16, points: 2, source: "qualified" },
  { id: "quarterfinals", label: "Reach the Quarter-finals", count: 8, points: 4, source: "round_of_16" },
  { id: "semifinals", label: "Reach the Semi-finals", count: 4, points: 8, source: "quarterfinals" },
  { id: "finalists", label: "Reach the Final", count: 2, points: 16, source: "semifinals" },
  { id: "champion", label: "World Cup Champion", count: 1, points: 32, source: "finalists" }
];

const WORLD_CUP_ROUND_OF_32 = [
  { match: 73, slots: ["2A", "2B"] },
  { match: 74, slots: ["1E", "3ABCDF"] },
  { match: 75, slots: ["1F", "2C"] },
  { match: 76, slots: ["1C", "2F"] },
  { match: 77, slots: ["1I", "3CDFGH"] },
  { match: 78, slots: ["2E", "2I"] },
  { match: 79, slots: ["1A", "3CEFHI"] },
  { match: 80, slots: ["1L", "3EHIJK"] },
  { match: 81, slots: ["1D", "3BEFIJ"] },
  { match: 82, slots: ["1G", "3AEHIJ"] },
  { match: 83, slots: ["2K", "2L"] },
  { match: 84, slots: ["1H", "2J"] },
  { match: 85, slots: ["1B", "3EFGIJ"] },
  { match: 86, slots: ["1J", "2H"] },
  { match: 87, slots: ["1K", "3DEIJL"] },
  { match: 88, slots: ["2D", "2G"] }
];

const WORLD_CUP_KNOCKOUT_ROUNDS = [
  {
    id: "round_of_16",
    title: "Round of 32",
    subtitle: "Pick the winner of each head-to-head match. Your 16 winners advance to the Round of 16.",
    matches: WORLD_CUP_ROUND_OF_32
  },
  {
    id: "quarterfinals",
    title: "Round of 16",
    subtitle: "Pick each winner to build your quarter-finals.",
    matches: [
      { match: 89, sources: [74, 77] },
      { match: 90, sources: [73, 75] },
      { match: 91, sources: [76, 78] },
      { match: 92, sources: [79, 80] },
      { match: 93, sources: [83, 84] },
      { match: 94, sources: [81, 82] },
      { match: 95, sources: [86, 88] },
      { match: 96, sources: [85, 87] }
    ]
  },
  {
    id: "semifinals",
    title: "Quarter-finals",
    subtitle: "Pick each winner to build your semi-finals.",
    matches: [
      { match: 97, sources: [89, 90] },
      { match: 98, sources: [93, 94] },
      { match: 99, sources: [91, 92] },
      { match: 100, sources: [95, 96] }
    ]
  },
  {
    id: "finalists",
    title: "Semi-finals",
    subtitle: "Pick the two teams that reach the World Cup Final.",
    matches: [
      { match: 101, sources: [97, 98] },
      { match: 102, sources: [99, 100] }
    ]
  },
  {
    id: "champion",
    title: "World Cup Final",
    subtitle: "Pick the 2026 World Cup champion.",
    matches: [{ match: 104, sources: [101, 102] }]
  }
];

const worldCupPicks = Object.fromEntries(WORLD_CUP_STAGES.map((stage) => [stage.id, []]));
worldCupPicks.group_thirds = [];
let worldCupResults = loadWorldCupLocalResults();
let lastSubmittedWorldCupPrediction = null;
let worldCupAdminPredictions = [];

const worldCupEls = {
  section: document.querySelector("#world-cup"),
  details: document.querySelector("#worldCupChallengeDetails"),
  toggle: document.querySelector("#worldCupToggle"),
  share: document.querySelector("#worldCupShare"),
  form: document.querySelector("#worldCupPredictionForm"),
  bracket: document.querySelector("#worldCupBracket"),
  downloadPdf: document.querySelector("#worldCupDownloadPdf"),
  message: document.querySelector("#worldCupFormMessage"),
  leaderboard: document.querySelector("#worldCupLeaderboard"),
  entryCount: document.querySelector("#worldCupEntryCount"),
  refresh: document.querySelector("#worldCupRefresh"),
  rules: document.querySelector("#worldCupRules"),
  resultForm: document.querySelector("#worldCupResultForm"),
  resultStage: document.querySelector("#worldCupResultStage"),
  resultHint: document.querySelector("#worldCupResultHint"),
  resultTeams: document.querySelector("#worldCupResultTeams"),
  adminSummary: document.querySelector("#worldCupAdminSummary"),
  adminRefresh: document.querySelector("#worldCupAdminRefresh"),
  deletePrediction: document.querySelector("#worldCupDeletePrediction"),
  predictionSelect: document.querySelector("#worldCupPredictionSelect"),
  predictionDetail: document.querySelector("#worldCupPredictionDetail")
};

function setWorldCupChallengeOpen(open, options = {}) {
  worldCupEls.details.classList.toggle("is-hidden", !open);
  worldCupEls.toggle.setAttribute("aria-expanded", String(open));
  worldCupEls.toggle.textContent = open ? "Close Challenge" : "Open Challenge";
  worldCupEls.section.classList.toggle("is-open", open);
  if (open && options.scroll) {
    worldCupEls.section.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function worldCupShareUrl() {
  return routeUrl("?challenge=world-cup", "#world-cup");
}

async function shareWorldCupChallenge() {
  const url = worldCupShareUrl();
  try {
    if (navigator.share) {
      await navigator.share({
        title: "BAFSL World Cup 2026 Bracket Challenge",
        text: "Make your World Cup 2026 predictions and join the BAFSL leaderboard.",
        url
      });
      return;
    }
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
    } else {
      fallbackCopyText(url);
    }
    showShareToast("Challenge link copied");
  } catch (error) {
    if (error?.name !== "AbortError") window.prompt("Copy this challenge link", url);
  }
}

function allWorldCupTeams() {
  return Object.values(WORLD_CUP_GROUPS).flat();
}

function loadWorldCupLocalPredictions() {
  try {
    return JSON.parse(localStorage.getItem(WORLD_CUP_LOCAL_PREDICTIONS)) || [];
  } catch {
    return [];
  }
}

function loadWorldCupLocalResults() {
  try {
    return JSON.parse(localStorage.getItem(WORLD_CUP_LOCAL_RESULTS)) || {};
  } catch {
    return {};
  }
}

function saveWorldCupLocalResults() {
  localStorage.setItem(WORLD_CUP_LOCAL_RESULTS, JSON.stringify(worldCupResults));
}

function worldCupStage(id) {
  return WORLD_CUP_STAGES.find((stage) => stage.id === id);
}

function worldCupOptions(stage) {
  if (stage.source === "groups") return allWorldCupTeams();
  if (stage.source === "thirds") return worldCupPicks.group_thirds;
  if (stage.source === "qualified") {
    return [
      ...worldCupPicks.group_winners,
      ...worldCupPicks.group_runners_up,
      ...worldCupPicks.best_thirds
    ];
  }
  return worldCupPicks[stage.source] || [];
}

function worldCupGroupForTeam(team) {
  return Object.entries(WORLD_CUP_GROUPS).find(([, teams]) => teams.includes(team))?.[0] || "";
}

function worldCupGroupTeam(group, position, picks = worldCupPicks) {
  const stageId = position === "1" ? "group_winners" : "group_runners_up";
  return (picks[stageId] || []).find((team) => WORLD_CUP_GROUPS[group]?.includes(team)) || "";
}

function assignWorldCupThirdPlaceSlots(picks = worldCupPicks) {
  const selected = [...(picks.best_thirds || [])];
  if (selected.length !== 8) return null;
  const combination = selected.map(worldCupGroupForTeam).sort().join("");
  const groupAssignments = WORLD_CUP_THIRD_PLACE_ALLOCATIONS[combination];
  if (!groupAssignments) return null;
  return Object.fromEntries(
    Object.entries(groupAssignments).map(([slot, group]) => [
      slot,
      selected.find((team) => worldCupGroupForTeam(team) === group) || ""
    ])
  );
}

function resolveWorldCupRoundOf32Slot(slot, thirdAssignments, picks = worldCupPicks) {
  if (slot.startsWith("3")) return thirdAssignments?.[slot] || "";
  return worldCupGroupTeam(slot.slice(1), slot[0], picks);
}

function worldCupKnockoutMatches(picks = worldCupPicks) {
  const winnerByMatch = {};
  const rounds = [];
  const thirdAssignments = assignWorldCupThirdPlaceSlots(picks);

  WORLD_CUP_KNOCKOUT_ROUNDS.forEach((round) => {
    const matches = round.matches.map((match) => {
      const teams = match.slots
        ? match.slots.map((slot) => resolveWorldCupRoundOf32Slot(slot, thirdAssignments, picks))
        : match.sources.map((source) => winnerByMatch[source] || "");
      const selected = (picks[round.id] || []).find((team) => teams.includes(team)) || "";
      winnerByMatch[match.match] = selected;
      return { ...match, teams, selected };
    });
    rounds.push({ ...round, matches });
  });

  return { rounds, thirdAssignments };
}

function trimLaterWorldCupPicks(stageId) {
  const stageIndex = WORLD_CUP_STAGES.findIndex((stage) => stage.id === stageId);
  for (let index = stageIndex + 1; index < WORLD_CUP_STAGES.length; index += 1) {
    const stage = WORLD_CUP_STAGES[index];
    const allowed = new Set(worldCupOptions(stage));
    worldCupPicks[stage.id] = worldCupPicks[stage.id].filter((team) => allowed.has(team)).slice(0, stage.count);
  }
}

function renderWorldCupGroupStage() {
  return `
    <div class="world-cup-stage-heading">
      <div><span class="mini-label">Step 1</span><h3>Pick Each Group's Top Three</h3></div>
      <p>Choose a winner, runner-up, and third-place team in every group.</p>
    </div>
    <div class="world-cup-groups">
      ${Object.entries(WORLD_CUP_GROUPS).map(([group, teams]) => `
        <fieldset class="world-cup-group">
          <legend>Group ${group}</legend>
          ${["group_winners", "group_runners_up", "group_thirds"].map((position, index) => {
            const value = worldCupPicks[position]?.find((team) => teams.includes(team)) || "";
            return `
              <label>
                ${["Winner", "Runner-up", "Third"][index]}
                <select data-world-cup-group="${group}" data-world-cup-position="${position}">
                  <option value="">Select team</option>
                  ${teams.map((team) => `<option value="${team}" ${team === value ? "selected" : ""}>${team}</option>`).join("")}
                </select>
              </label>
            `;
          }).join("")}
        </fieldset>
      `).join("")}
    </div>
  `;
}

function renderWorldCupBestThirds(stage, step) {
  const options = worldCupOptions(stage);
  const selected = new Set(worldCupPicks[stage.id]);
  return `
    <section class="world-cup-pick-stage">
      <div class="world-cup-stage-heading">
        <div><span class="mini-label">Step ${step}</span><h3>${stage.label}</h3></div>
        <p><strong>${selected.size}/${stage.count}</strong> selected &middot; ${stage.points} point${stage.points === 1 ? "" : "s"} each</p>
      </div>
      <div class="world-cup-team-picks ${stage.count <= 4 ? "is-small" : ""}">
        ${options.map((team) => `
          <label class="world-cup-team-choice ${selected.has(team) ? "is-selected" : ""}">
            <input type="${stage.count === 1 ? "radio" : "checkbox"}" name="pick-${stage.id}" value="${team}" data-world-cup-stage="${stage.id}" ${selected.has(team) ? "checked" : ""} />
            <span>${team}</span>
          </label>
        `).join("") || `<p class="rank-meta">Complete the previous stage to unlock these picks.</p>`}
      </div>
    </section>
  `;
}

function renderWorldCupKnockoutRound(round, step, thirdAssignments) {
  const complete = round.matches.every((match) => match.teams.every(Boolean));
  const selectedCount = round.matches.filter((match) => match.selected).length;
  const stage = worldCupStage(round.id);
  const thirdPlaceWarning = round.id === "round_of_16" && !thirdAssignments && worldCupPicks.best_thirds.length === 8
    ? `<p class="world-cup-bracket-warning">Those eight third-place groups cannot fill the official FIFA bracket slots. Adjust your best third-place selections.</p>`
    : "";

  return `
    <section class="world-cup-pick-stage">
      <div class="world-cup-stage-heading">
        <div><span class="mini-label">Step ${step}</span><h3>${round.title}</h3></div>
        <p><strong>${selectedCount}/${round.matches.length}</strong> winners picked &middot; ${stage.points} point${stage.points === 1 ? "" : "s"} each</p>
      </div>
      <p class="world-cup-round-copy">${round.subtitle}</p>
      ${thirdPlaceWarning}
      <div class="world-cup-matchups">
        ${complete ? round.matches.map((match) => `
          <fieldset class="world-cup-matchup">
            <legend>Match ${match.match}</legend>
            ${match.teams.map((team) => `
              <label class="world-cup-match-team ${match.selected === team ? "is-selected" : ""}">
                <input type="radio" name="match-${match.match}" value="${team}" data-world-cup-stage="${round.id}" data-world-cup-match="${match.match}" ${match.selected === team ? "checked" : ""} />
                <span>${team}</span>
              </label>
            `).join("")}
          </fieldset>
        `).join("") : `<p class="rank-meta">Complete the previous stage to unlock these head-to-head matches.</p>`}
      </div>
    </section>
  `;
}

function renderWorldCupBracket() {
  const knockout = worldCupKnockoutMatches();
  worldCupEls.bracket.innerHTML = `
    ${renderWorldCupGroupStage()}
    ${renderWorldCupBestThirds(WORLD_CUP_STAGES[2], 2)}
    ${knockout.rounds.map((round, index) => renderWorldCupKnockoutRound(round, index + 3, knockout.thirdAssignments)).join("")}
  `;
}

function updateGroupPick(select) {
  const group = select.dataset.worldCupGroup;
  const position = select.dataset.worldCupPosition;
  const teams = WORLD_CUP_GROUPS[group];
  const groupSelects = [...document.querySelectorAll(`[data-world-cup-group="${group}"]`)];
  const values = groupSelects.map((item) => item.value).filter(Boolean);

  if (new Set(values).size !== values.length) {
    select.value = "";
    worldCupEls.message.textContent = "Each team can only occupy one position in its group.";
    return;
  }

  worldCupPicks[position] = worldCupPicks[position].filter((team) => !teams.includes(team));
  if (select.value) worldCupPicks[position].push(select.value);

  worldCupPicks.best_thirds = worldCupPicks.best_thirds.filter((team) => worldCupPicks.group_thirds.includes(team));
  trimLaterWorldCupPicks("group_runners_up");
  window.setTimeout(renderWorldCupBracket, 0);
}

function updateStagePick(input) {
  const stage = worldCupStage(input.dataset.worldCupStage);
  if (!stage) return;

  if (input.dataset.worldCupMatch) {
    const knockout = worldCupKnockoutMatches();
    const round = knockout.rounds.find((item) => item.id === stage.id);
    const match = round?.matches.find((item) => String(item.match) === input.dataset.worldCupMatch);
    if (!match) return;
    worldCupPicks[stage.id] = worldCupPicks[stage.id].filter((team) => !match.teams.includes(team));
    if (input.checked) worldCupPicks[stage.id].push(input.value);
  } else if (stage.count === 1) {
    worldCupPicks[stage.id] = input.checked ? [input.value] : [];
  } else if (input.checked) {
    if (worldCupPicks[stage.id].length >= stage.count) {
      input.checked = false;
      worldCupEls.message.textContent = `Choose exactly ${stage.count} teams for ${stage.label}.`;
      return;
    }
    worldCupPicks[stage.id].push(input.value);
  } else {
    worldCupPicks[stage.id] = worldCupPicks[stage.id].filter((team) => team !== input.value);
  }

  trimLaterWorldCupPicks(stage.id);
  worldCupEls.message.textContent = "";
  window.setTimeout(renderWorldCupBracket, 0);
}

function validateWorldCupPicks() {
  if (worldCupPicks.group_winners.length !== 12 || worldCupPicks.group_runners_up.length !== 12 || worldCupPicks.group_thirds.length !== 12) {
    return "Complete the top three picks for all 12 groups.";
  }
  for (const stage of WORLD_CUP_STAGES.slice(2)) {
    if (worldCupPicks[stage.id].length !== stage.count) {
      return `Choose ${stage.count} team${stage.count === 1 ? "" : "s"} for ${stage.label}.`;
    }
  }
  if (!assignWorldCupThirdPlaceSlots()) {
    return "Adjust the eight best third-place teams so they fit the official FIFA Round of 32 bracket.";
  }
  return "";
}

function submissionPicks() {
  return {
    ...structuredClone(worldCupPicks)
  };
}

function normalizeWorldCupIdentity(value) {
  return String(value || "").trim().toLocaleLowerCase();
}

async function submitWorldCupPrediction(name, email, picks) {
  if (new Date() >= WORLD_CUP_ENTRY_DEADLINE) {
    throw new Error("World Cup bracket entries are closed.");
  }

  const saveLocal = () => {
    const predictions = loadWorldCupLocalPredictions();
    const normalizedName = normalizeWorldCupIdentity(name);
    const normalizedEmail = normalizeWorldCupIdentity(email);
    if (predictions.some((entry) => normalizeWorldCupIdentity(entry.name) === normalizedName)) {
      throw new Error("That name has already been used.");
    }
    if (predictions.some((entry) => normalizeWorldCupIdentity(entry.email) === normalizedEmail)) {
      throw new Error("That email address has already been used.");
    }
    const savedPrediction = { id: crypto.randomUUID(), name, email, picks, submitted_at: new Date().toISOString() };
    predictions.push(savedPrediction);
    localStorage.setItem(WORLD_CUP_LOCAL_PREDICTIONS, JSON.stringify(predictions));
    return savedPrediction;
  };

  if (!remoteConfigured()) {
    return saveLocal();
  }

  const response = await fetch(`${REMOTE_CONFIG.supabaseUrl.replace(/\/$/, "")}/rest/v1/rpc/submit_world_cup_prediction`, {
    method: "POST",
    headers: remoteHeaders(),
    body: JSON.stringify({
      participant_name: name,
      participant_email: email,
      participant_picks: picks
    })
  });
  if (!response.ok) {
    if (response.status === 404) {
      return saveLocal();
    }
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

async function createBrandedWorldCupPdf(prediction) {
  const { PDFDocument, StandardFonts, rgb } = PDFLib;
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const logoBytes = await fetch("assets/bafsl-logo.png").then((response) => response.arrayBuffer());
  const logo = await pdf.embedPng(logoBytes);
  const pageSize = [612, 792];
  const green = rgb(0.047, 0.31, 0.267);
  const yellow = rgb(0.941, 0.706, 0.161);
  const ink = rgb(0.071, 0.125, 0.114);
  const muted = rgb(0.38, 0.44, 0.42);
  const pale = rgb(0.957, 0.969, 0.961);
  let page;
  let y;
  const pdfText = (value) => String(value ?? "-")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "?");

  const addPage = (heading) => {
    page = pdf.addPage(pageSize);
    page.drawRectangle({ x: 0, y: 718, width: 612, height: 74, color: green });
    page.drawImage(logo, { x: 38, y: 730, width: 50, height: 50 });
    page.drawText("BAFSL", { x: 102, y: 758, size: 19, font: bold, color: rgb(1, 1, 1) });
    page.drawText("Bay Area Friendly Soccer League", { x: 102, y: 740, size: 9, font: regular, color: rgb(0.85, 0.92, 0.9) });
    page.drawText(pdfText(heading), { x: 38, y: 690, size: 22, font: bold, color: ink });
    page.drawRectangle({ x: 38, y: 678, width: 72, height: 4, color: yellow });
    page.drawText("BAFSL.COM  |  WORLD CUP 2026 BRACKET CHALLENGE", { x: 38, y: 22, size: 8, font: bold, color: muted });
    y = 654;
  };

  const sectionHeading = (text) => {
    if (y < 90) addPage(text);
    page.drawRectangle({ x: 38, y: y - 4, width: 536, height: 24, color: green });
    page.drawText(pdfText(text).toUpperCase(), { x: 48, y: y + 3, size: 11, font: bold, color: rgb(1, 1, 1) });
    y -= 34;
  };

  const row = (label, value, options = {}) => {
    if (y < 62) addPage(options.pageHeading || "Prediction Details");
    if (options.shade) page.drawRectangle({ x: 38, y: y - 6, width: 536, height: 22, color: pale });
    page.drawText(pdfText(label), { x: 48, y, size: 9, font: bold, color: green });
    page.drawText(pdfText(value), { x: options.valueX || 150, y, size: 9, font: regular, color: ink, maxWidth: 414 });
    y -= options.height || 22;
  };

  const matchCard = (match, roundTitle) => {
    if (y < 132) addPage(roundTitle);
    const teamA = pdfText(match.teams[0] || "TBD");
    const teamB = pdfText(match.teams[1] || "TBD");
    const winner = pdfText(match.selected || "No prediction");
    page.drawRectangle({
      x: 38,
      y: y - 70,
      width: 536,
      height: 82,
      color: rgb(1, 1, 1),
      borderColor: rgb(0.82, 0.87, 0.84),
      borderWidth: 1
    });
    page.drawText(`MATCH ${match.match}`, { x: 50, y: y - 3, size: 8, font: bold, color: muted });
    page.drawText(teamA, { x: 50, y: y - 25, size: 12, font: bold, color: ink, maxWidth: 205 });
    page.drawText("VS", { x: 294, y: y - 25, size: 9, font: bold, color: muted });
    page.drawText(teamB, { x: 332, y: y - 25, size: 12, font: bold, color: ink, maxWidth: 225 });
    page.drawRectangle({ x: 38, y: y - 70, width: 536, height: 27, color: green });
    page.drawText("PREDICTED WINNER", { x: 50, y: y - 60, size: 8, font: bold, color: rgb(0.78, 0.9, 0.85) });
    page.drawText(winner, { x: 178, y: y - 61, size: 12, font: bold, color: yellow, maxWidth: 370 });
    y -= 94;
  };

  addPage("World Cup 2026 Prediction");
  page.drawText("OFFICIAL PREDICTION RECORD", { x: 38, y: y, size: 10, font: bold, color: green });
  y -= 30;
  page.drawRectangle({ x: 38, y: y - 54, width: 536, height: 72, color: pale });
  page.drawText(pdfText(prediction.name), { x: 54, y: y - 4, size: 20, font: bold, color: ink });
  page.drawText(pdfText(prediction.email), { x: 54, y: y - 26, size: 10, font: regular, color: muted });
  page.drawText(`Submitted ${new Date(prediction.submitted_at).toLocaleString()}`, { x: 54, y: y - 43, size: 9, font: regular, color: muted });
  y -= 84;

  sectionHeading("Group Stage Top Three");
  Object.entries(WORLD_CUP_GROUPS).forEach(([group, teams], index) => {
    const winner = (prediction.picks.group_winners || []).find((team) => teams.includes(team)) || "-";
    const runnerUp = (prediction.picks.group_runners_up || []).find((team) => teams.includes(team)) || "-";
    const third = (prediction.picks.group_thirds || []).find((team) => teams.includes(team)) || "-";
    row(`GROUP ${group}`, `1. ${winner}    2. ${runnerUp}    3. ${third}`, { shade: index % 2 === 0 });
  });

  sectionHeading("Best Third-place Teams");
  row("ADVANCING", (prediction.picks.best_thirds || []).join(", "), { valueX: 118, height: 30 });

  worldCupKnockoutMatches(prediction.picks).rounds.forEach((round) => {
    addPage(round.title);
    page.drawText("Each card shows the predicted fixture and selected winner.", { x: 38, y: 654, size: 10, font: regular, color: muted });
    y = 626;
    round.matches.forEach((match) => matchCard(match, round.title));
  });

  const champion = prediction.picks.champion?.[0] || "No pick";
  page.drawRectangle({ x: 38, y: Math.max(76, y - 70), width: 536, height: 58, color: yellow });
  page.drawText("PREDICTED WORLD CUP 2026 CHAMPION", { x: 54, y: Math.max(112, y - 34), size: 10, font: bold, color: ink });
  page.drawText(pdfText(champion), { x: 54, y: Math.max(90, y - 55), size: 20, font: bold, color: green });
  const bytes = await pdf.save();
  return new Blob([bytes], { type: "application/pdf" });
}

async function downloadWorldCupPredictionPdf(prediction) {
  if (!prediction) return;
  const blob = await createBrandedWorldCupPdf(prediction);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `world-cup-2026-prediction-${slugify(prediction.name)}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function scoreWorldCupPrediction(picks) {
  return WorldCupScoring.scorePrediction(picks, worldCupResults, WORLD_CUP_STAGES);
}

async function loadWorldCupLeaderboard() {
  worldCupEls.leaderboard.innerHTML = `<p class="rank-meta">Loading leaderboard...</p>`;
  try {
    let rows;
    if (remoteConfigured()) {
      const response = await fetch(`${REMOTE_CONFIG.supabaseUrl.replace(/\/$/, "")}/rest/v1/world_cup_leaderboard?select=id,name,score,submitted_at&order=score.desc,submitted_at.asc`, {
        headers: remoteHeaders()
      });
      if (response.ok) {
        rows = await response.json();
      } else if (response.status === 404) {
        rows = loadWorldCupLocalPredictions()
          .map((entry) => ({ ...entry, score: scoreWorldCupPrediction(entry.picks) }))
          .sort((a, b) => b.score - a.score || a.submitted_at.localeCompare(b.submitted_at));
      } else {
        throw new Error("Leaderboard unavailable.");
      }
    } else {
      rows = loadWorldCupLocalPredictions()
        .map((entry) => ({ ...entry, score: scoreWorldCupPrediction(entry.picks) }))
        .sort((a, b) => b.score - a.score || a.submitted_at.localeCompare(b.submitted_at));
    }

    worldCupEls.entryCount.textContent = rows.length;
    worldCupEls.leaderboard.innerHTML = rows.length ? rows.map((entry, index) => `
      <div class="world-cup-leader-row">
        <span class="world-cup-rank">${index + 1}</span>
        <div><strong>${escapeAttr(entry.name)}</strong><span>Bracket submitted ${new Date(entry.submitted_at).toLocaleDateString()}</span></div>
        <strong class="world-cup-score">${entry.score} pts</strong>
      </div>
    `).join("") : `<p class="rank-meta">No brackets yet. Be the first to enter.</p>`;
  } catch {
    worldCupEls.leaderboard.innerHTML = `<p class="rank-meta">The leaderboard will appear after the World Cup database update is installed.</p>`;
  }
}

function renderWorldCupRules() {
  worldCupEls.rules.innerHTML = `
    <div class="world-cup-rule-card"><strong>How it works</strong><p>Pick each group's top three, choose the eight third-place teams that advance, then predict every knockout milestone through the champion.</p></div>
    ${WORLD_CUP_STAGES.map((stage) => `
      <div class="world-cup-rule-card"><strong>${stage.points} pt${stage.points === 1 ? "" : "s"}</strong><p>For each correct ${stage.label.toLowerCase()} pick.</p></div>
    `).join("")}
    <div class="world-cup-rule-card"><strong>Ties</strong><p>The bracket submitted earliest ranks higher when total scores are tied.</p></div>
  `;
}

function renderWorldCupAdmin() {
  worldCupEls.resultStage.innerHTML = WORLD_CUP_STAGES.map((stage) => `<option value="${stage.id}">${stage.label}</option>`).join("");
  renderWorldCupAdminStage();
}

function renderWorldCupAdminStage() {
  const stage = worldCupStage(worldCupEls.resultStage.value || WORLD_CUP_STAGES[0].id);
  const selected = new Set(worldCupResults[stage.id] || []);
  const eligibleTeams = WorldCupScoring.eligibleTeams(stage.id, worldCupResults, allWorldCupTeams());
  const unavailableCount = allWorldCupTeams().length - eligibleTeams.length;
  worldCupEls.resultHint.textContent = `Mark up to ${stage.count} actual team${stage.count === 1 ? "" : "s"}. ${unavailableCount ? `${unavailableCount} ineligible team${unavailableCount === 1 ? " is" : "s are"} hidden based on earlier results.` : "Save after each game as teams advance."}`;
  worldCupEls.resultTeams.innerHTML = eligibleTeams.map((team) => `
    <label class="world-cup-team-choice ${selected.has(team) ? "is-selected" : ""}">
      <input type="${stage.count === 1 ? "radio" : "checkbox"}" name="actual-team" value="${team}" ${selected.has(team) ? "checked" : ""} />
      <span>${team}</span>
    </label>
  `).join("") || `<p class="rank-meta">Complete and save the previous result stage first.</p>`;
  worldCupEls.adminSummary.innerHTML = WORLD_CUP_STAGES.map((item) => `
    <div><span>${item.label}</span><strong>${(worldCupResults[item.id] || []).length}/${item.count}</strong></div>
  `).join("");
}

function renderWorldCupAdminPrediction() {
  const prediction = worldCupAdminPredictions.find((entry) => entry.id === worldCupEls.predictionSelect.value);
  if (!prediction) {
    worldCupEls.deletePrediction.disabled = true;
    worldCupEls.predictionDetail.innerHTML = `<p class="rank-meta">Choose a participant to see their complete prediction.</p>`;
    return;
  }
  worldCupEls.deletePrediction.disabled = false;

  worldCupEls.predictionDetail.innerHTML = `
    <div class="world-cup-admin-person">
      <strong>${escapeAttr(prediction.name)}</strong>
      <span>${escapeAttr(prediction.email)}</span>
      <span>Submitted ${new Date(prediction.submitted_at).toLocaleString()}</span>
    </div>
    <div class="world-cup-admin-pick-list">
      ${WORLD_CUP_STAGES.slice(0, 3).map((stage) => `
        <div>
          <strong>${stage.label}</strong>
          <span>${(prediction.picks?.[stage.id] || []).map(escapeAttr).join(", ") || "No picks"}</span>
        </div>
      `).join("")}
      <div>
        <strong>All Third-place Picks</strong>
        <span>${(prediction.picks?.group_thirds || []).map(escapeAttr).join(", ") || "No picks"}</span>
      </div>
      ${worldCupKnockoutMatches(prediction.picks || {}).rounds.map((round) => `
        <div>
          <strong>${round.title}</strong>
          <span>${round.matches.map((match) => `Match ${match.match}: ${escapeAttr(match.teams[0] || "TBD")} vs ${escapeAttr(match.teams[1] || "TBD")} -> ${escapeAttr(match.selected || "No pick")}`).join("<br />")}</span>
        </div>
      `).join("")}
    </div>
  `;
}

async function deleteWorldCupPrediction() {
  const prediction = worldCupAdminPredictions.find((entry) => entry.id === worldCupEls.predictionSelect.value);
  if (!prediction) return;
  if (!window.confirm(`Delete the bracket entry for ${prediction.name}? This cannot be undone.`)) return;

  try {
    if (remoteConfigured() && remoteAccessToken) {
      const response = await fetch(`${REMOTE_CONFIG.supabaseUrl.replace(/\/$/, "")}/rest/v1/world_cup_predictions?id=eq.${encodeURIComponent(prediction.id)}`, {
        method: "DELETE",
        headers: remoteHeaders({
          Authorization: `Bearer ${remoteAccessToken}`,
          Prefer: "return=minimal"
        })
      });
      if (!response.ok) throw new Error("Entry could not be deleted.");
    } else {
      const remaining = loadWorldCupLocalPredictions().filter((entry) => entry.id !== prediction.id);
      localStorage.setItem(WORLD_CUP_LOCAL_PREDICTIONS, JSON.stringify(remaining));
    }
    els.adminMessage.textContent = `${prediction.name}'s bracket entry was deleted.`;
    await loadWorldCupAdminPredictions();
    await loadWorldCupLeaderboard();
  } catch (error) {
    els.adminMessage.textContent = error.message || "Entry could not be deleted.";
  }
}

async function loadWorldCupAdminPredictions() {
  worldCupEls.predictionDetail.innerHTML = `<p class="rank-meta">Loading submitted predictions...</p>`;
  try {
    if (remoteConfigured() && remoteAccessToken) {
      const response = await fetch(`${REMOTE_CONFIG.supabaseUrl.replace(/\/$/, "")}/rest/v1/world_cup_predictions?select=id,name,email,picks,submitted_at&order=submitted_at.desc`, {
        headers: remoteHeaders({ Authorization: `Bearer ${remoteAccessToken}` })
      });
      if (!response.ok) throw new Error("Predictions could not be loaded.");
      worldCupAdminPredictions = await response.json();
    } else {
      worldCupAdminPredictions = loadWorldCupLocalPredictions().sort((a, b) => b.submitted_at.localeCompare(a.submitted_at));
    }

    worldCupEls.predictionSelect.innerHTML = worldCupAdminPredictions.length
      ? worldCupAdminPredictions.map((entry) => `<option value="${entry.id}">${escapeAttr(entry.name)} - ${escapeAttr(entry.email)}</option>`).join("")
      : `<option value="">No predictions submitted</option>`;
    renderWorldCupAdminPrediction();
  } catch {
    worldCupEls.predictionSelect.innerHTML = `<option value="">Predictions unavailable</option>`;
    worldCupEls.predictionDetail.innerHTML = `<p class="rank-meta">Sign in as a Supabase admin and install the updated database script to view private predictions.</p>`;
  }
}

async function saveWorldCupRemoteResults(stageId, teams) {
  if (!remoteConfigured() || !remoteAccessToken) return false;
  const endpoint = `${REMOTE_CONFIG.supabaseUrl.replace(/\/$/, "")}/rest/v1/world_cup_results`;
  const headers = remoteHeaders({ Authorization: `Bearer ${remoteAccessToken}` });
  const deleteResponse = await fetch(`${endpoint}?stage=eq.${encodeURIComponent(stageId)}`, { method: "DELETE", headers });
  if (!deleteResponse.ok) throw new Error("Old results could not be cleared.");
  if (!teams.length) return true;
  const insertResponse = await fetch(endpoint, {
    method: "POST",
    headers: { ...headers, Prefer: "return=minimal" },
    body: JSON.stringify(teams.map((team) => ({ stage: stageId, team })))
  });
  if (!insertResponse.ok) throw new Error("Results could not be saved.");
  return true;
}

async function saveAllWorldCupRemoteResults() {
  if (!remoteConfigured() || !remoteAccessToken) return false;
  for (const stage of WORLD_CUP_STAGES) {
    await saveWorldCupRemoteResults(stage.id, worldCupResults[stage.id] || []);
  }
  return true;
}

async function loadWorldCupRemoteResults() {
  if (!remoteConfigured()) return;
  try {
    const response = await fetch(`${REMOTE_CONFIG.supabaseUrl.replace(/\/$/, "")}/rest/v1/world_cup_results?select=stage,team`, {
      headers: remoteHeaders()
    });
    if (!response.ok) return;
    const rows = await response.json();
    worldCupResults = rows.reduce((results, row) => {
      results[row.stage] = results[row.stage] || [];
      results[row.stage].push(row.team);
      return results;
    }, {});
    worldCupResults = WorldCupScoring.trimInvalidResults(worldCupResults, WORLD_CUP_STAGES, allWorldCupTeams());
    saveWorldCupLocalResults();
    renderWorldCupAdminStage();
  } catch {
    // Local results remain available when the World Cup tables are not installed yet.
  }
}

document.querySelector(".world-cup-tabs").addEventListener("click", (event) => {
  const button = event.target.closest("[data-world-cup-view]");
  if (!button) return;
  document.querySelectorAll(".world-cup-tab").forEach((tab) => tab.classList.toggle("is-active", tab === button));
  document.querySelectorAll("[data-world-cup-panel]").forEach((panel) => {
    panel.classList.toggle("is-hidden", panel.dataset.worldCupPanel !== button.dataset.worldCupView);
  });
  if (button.dataset.worldCupView === "leaderboard") loadWorldCupLeaderboard();
});

worldCupEls.toggle.addEventListener("click", () => {
  setWorldCupChallengeOpen(worldCupEls.details.classList.contains("is-hidden"));
});
worldCupEls.share.addEventListener("click", shareWorldCupChallenge);
document.addEventListener("click", (event) => {
  if (event.target.closest('a[href="#world-cup"]')) setWorldCupChallengeOpen(false);
});

worldCupEls.bracket.addEventListener("change", (event) => {
  const groupSelect = event.target.closest("[data-world-cup-group]");
  if (groupSelect) {
    updateGroupPick(groupSelect);
    return;
  }
  const stageInput = event.target.closest("[data-world-cup-stage]");
  if (stageInput) updateStagePick(stageInput);
});

worldCupEls.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const validationMessage = validateWorldCupPicks();
  if (validationMessage) {
    worldCupEls.message.textContent = validationMessage;
    return;
  }

  const form = new FormData(event.currentTarget);
  const submitButton = event.currentTarget.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  worldCupEls.downloadPdf.classList.add("is-hidden");
  worldCupEls.message.textContent = "Submitting your bracket...";
  try {
    lastSubmittedWorldCupPrediction = await submitWorldCupPrediction(
      String(form.get("name")).trim(),
      String(form.get("email")).trim(),
      submissionPicks()
    );
    worldCupEls.message.textContent = "Your bracket is in. Download the PDF for your records.";
    worldCupEls.downloadPdf.classList.remove("is-hidden");
    await loadWorldCupLeaderboard();
  } catch (error) {
    worldCupEls.message.textContent = error.message || "Your bracket could not be submitted. Please try again.";
  } finally {
    submitButton.disabled = new Date() >= WORLD_CUP_ENTRY_DEADLINE;
  }
});

worldCupEls.refresh.addEventListener("click", loadWorldCupLeaderboard);
worldCupEls.downloadPdf.addEventListener("click", () => downloadWorldCupPredictionPdf(lastSubmittedWorldCupPrediction));
worldCupEls.resultStage.addEventListener("change", renderWorldCupAdminStage);
worldCupEls.adminRefresh.addEventListener("click", loadWorldCupAdminPredictions);
worldCupEls.deletePrediction.addEventListener("click", deleteWorldCupPrediction);
worldCupEls.predictionSelect.addEventListener("change", renderWorldCupAdminPrediction);

document.querySelector(".admin-tabs").addEventListener("click", (event) => {
  if (event.target.closest('[data-admin-view="world-cup"]')) loadWorldCupAdminPredictions();
});

els.loginForm.addEventListener("submit", () => {
  worldCupEls.predictionDetail.innerHTML = `<p class="rank-meta">Sign in to load private predictions.</p>`;
});

document.addEventListener("bafsl-admin-login", loadWorldCupAdminPredictions);

worldCupEls.resultTeams.addEventListener("change", (event) => {
  const stage = worldCupStage(worldCupEls.resultStage.value);
  if (event.target.checked && ["group_winners", "group_runners_up"].includes(stage.id)) {
    const selectedGroup = worldCupTeamGroup(event.target.value);
    const groupAlreadySelected = [...worldCupEls.resultTeams.querySelectorAll("input:checked")]
      .some((input) => input !== event.target && worldCupTeamGroup(input.value) === selectedGroup);
    if (groupAlreadySelected) {
      event.target.checked = false;
      els.adminMessage.textContent = `Only one ${stage.label.toLowerCase().replace(/s$/, "")} can be selected from Group ${selectedGroup}.`;
    }
  }
  const checked = [...worldCupEls.resultTeams.querySelectorAll("input:checked")];
  if (checked.length > stage.count) {
    event.target.checked = false;
    els.adminMessage.textContent = `Only ${stage.count} teams can be marked for ${stage.label}.`;
  }
  event.target.closest(".world-cup-team-choice")?.classList.toggle("is-selected", event.target.checked);
});

worldCupEls.resultForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const stageId = worldCupEls.resultStage.value;
  const teams = [...worldCupEls.resultTeams.querySelectorAll("input:checked")].map((input) => input.value);
  worldCupResults[stageId] = teams;
  worldCupResults = WorldCupScoring.trimInvalidResults(worldCupResults, WORLD_CUP_STAGES, allWorldCupTeams());
  saveWorldCupLocalResults();
  try {
    const synced = await saveAllWorldCupRemoteResults();
    els.adminMessage.textContent = synced ? "World Cup results saved and leaderboard updated." : "Results saved in this browser. Sign in to sync them live.";
  } catch {
    els.adminMessage.textContent = "Results saved locally, but the live update failed.";
  }
  renderWorldCupAdminStage();
  loadWorldCupLeaderboard();
});

renderWorldCupBracket();
renderWorldCupRules();
renderWorldCupAdmin();
loadWorldCupRemoteResults();
loadWorldCupLeaderboard();

if (new URLSearchParams(window.location.search).get("challenge") === "world-cup") {
  setWorldCupChallengeOpen(true);
}

if (new Date() >= WORLD_CUP_ENTRY_DEADLINE) {
  worldCupEls.form.querySelector('button[type="submit"]').disabled = true;
  worldCupEls.message.textContent = "World Cup bracket entries are closed.";
}
