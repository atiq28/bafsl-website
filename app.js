const STORAGE_KEY = "bafsl-league-state-v5";
const REMOTE_CONFIG = window.BAFSL_REMOTE || {};
let remoteReady = false;
let remoteSaving = false;
let remoteAccessToken = "";

const rosters = {
  svfc: ["Amit", "Ishraq", "Anupom", "Huda", "Shakil", "Tito", "Raihan", "Tonmoy", "Mridul", "Tanjeem", "Kazi", "Mizan", "Abrar", "Kevin", "Samuel", "Rayyan", "Ornob", "Samin", "Mushfiq", "Shafkat"],
  kbfc: ["Fahim", "Tahmid U", "Rivan", "Atiq", "Habib", "Muyeed", "Faisal", "Sumedh", "Sunny", "Arman", "Nafees", "Sameen", "Sabiq", "Bappy", "Tahmid M", "Shahbaz", "Shaman", "Farzad", "Irshad", "Rony"],
  fcbb: ["Sirat", "Baky", "Anik", "Asif", "Jony", "Nazibul", "Opu", "Sayedul Aman", "Hanzalah", "Moayad", "Shimul", "Monir", "Uzzal", "Rahamin", "Saju", "Shouman", "Mithu", "Tanzir", "Taru"],
  stfc: ["Ankur", "Zashim", "Arka", "Towfiq", "Nazrul", "Rumi", "Albhee", "Kiran", "Shah Roman", "Sani", "Athiqul", "Sahil Dip", "Sandipan", "Shafeey", "Mahadi", "Rabbani", "Sadi", "Zamil", "Miraz", "Raiyan"],
  bufc: ["Salman", "Mobasher", "Zahid", "Siddik", "Hassan", "Abrar", "Pablo", "Nayeer", "Tes", "Shafique", "Nurul", "Nawaz", "Azmir", "Mir Ali", "Sadman", "Jakaria", "Suvo", "Sagor", "Obaid", "Azizul"]
};

const defaultState = {
  selectedLeague: "premier",
  selectedSeason: "premier-2026-27",
  selectedDivision: "premier-2026-27-main",
  selectedFilter: "all",
  adminLoggedIn: false,
  leagues: [
    { id: "premier", name: "Premier League" },
    { id: "pioneer", name: "Pioneer League" }
  ],
  seasons: [
    { id: "premier-2026-27", league: "premier", name: "2026-27 Season", startsOn: "2026-05-03" },
    { id: "premier-2025-26", league: "premier", name: "2025-26 Season", startsOn: "2025-10-01" },
    { id: "pioneer-2026-27", league: "pioneer", name: "2026-27 Season", startsOn: "2026-05-03" },
    { id: "pioneer-2025-26", league: "pioneer", name: "2025-26 Season", startsOn: "2025-10-01" }
  ],
  divisions: [
    { id: "premier-2026-27-main", league: "premier", season: "premier-2026-27", name: "Premier League" },
    { id: "premier-2025-26-main", league: "premier", season: "premier-2025-26", name: "Premier League" },
    { id: "pioneer-2026-27-main", league: "pioneer", season: "pioneer-2026-27", name: "Pioneer League" },
    { id: "pioneer-2025-26-main", league: "pioneer", season: "pioneer-2025-26", name: "Pioneer League" }
  ],
  teams: [
    { id: "svfc", division: "premier-2026-27-main", name: "SVFC", shortName: "SVFC", logo: "assets/teams/svfc.png", roster: rosters.svfc },
    { id: "kbfc", division: "premier-2026-27-main", name: "KBFC", shortName: "KBFC", logo: "assets/teams/kbfc.png", roster: rosters.kbfc },
    { id: "fcbb", division: "premier-2026-27-main", name: "FCBB", shortName: "FCBB", logo: "assets/teams/fcbb.png", roster: rosters.fcbb },
    { id: "stfc", division: "premier-2026-27-main", name: "STFC", shortName: "STFC", logo: "assets/teams/stfc.png", roster: rosters.stfc },
    { id: "bufc", division: "premier-2026-27-main", name: "BUFC", shortName: "BUFC", logo: "assets/teams/bufc.jpeg", roster: rosters.bufc },
    { id: "svfc-2025", division: "premier-2025-26-main", name: "SVFC", shortName: "SVFC", logo: "assets/teams/svfc.png", roster: rosters.svfc },
    { id: "kbfc-2025", division: "premier-2025-26-main", name: "KBFC", shortName: "KBFC", logo: "assets/teams/kbfc.png", roster: rosters.kbfc },
    { id: "fcbb-2025", division: "premier-2025-26-main", name: "FCBB", shortName: "FCBB", logo: "assets/teams/fcbb.png", roster: rosters.fcbb },
    { id: "stfc-2025", division: "premier-2025-26-main", name: "STFC", shortName: "STFC", logo: "assets/teams/stfc.png", roster: rosters.stfc }
  ],
  matches: [
    { id: "m1", division: "premier-2026-27-main", date: "2026-05-03", time: "09:00", venue: "Bay Area Field", home: "svfc", away: "fcbb", homeScore: null, awayScore: null, status: "upcoming", events: [] },
    { id: "m2", division: "premier-2026-27-main", date: "2026-05-03", time: "10:30", venue: "Bay Area Field", home: "bufc", away: "stfc", homeScore: null, awayScore: null, status: "upcoming", events: [] },
    { id: "m3", division: "premier-2026-27-main", date: "2026-05-10", time: "09:00", venue: "Bay Area Field", home: "kbfc", away: "fcbb", homeScore: null, awayScore: null, status: "upcoming", events: [] },
    { id: "m4", division: "premier-2026-27-main", date: "2026-05-10", time: "10:30", venue: "Bay Area Field", home: "stfc", away: "svfc", homeScore: null, awayScore: null, status: "upcoming", events: [] },
    { id: "m5", division: "premier-2026-27-main", date: "2026-05-17", time: "09:00", venue: "Bay Area Field", home: "bufc", away: "kbfc", homeScore: null, awayScore: null, status: "upcoming", events: [] }
  ],
  news: [
    { id: "story-premier-2026-27-starts", category: "Premier League", title: "Premier League 2026-27 starts tomorrow", body: "SVFC, KBFC, FCBB, STFC, and BUFC begin the new BAFSL Premier League season on May 3, 2026.", date: "May 2, 2026", image: "assets/news/meet-the-teams.png" },
    { id: "story-premier-2025-26-table", category: "Archive", title: "Premier League 2025-26 final table", body: "SVFC finished top of the 2025-26 Premier League table with 15 points from six games.", date: "February 7, 2026", image: "assets/news/points-table-2025-26.png" },
    { id: "story-premier-2025-26-scorers", category: "Archive", title: "Samuel leads 2025-26 scorers", body: "Samuel of SVFC finished the Feb. 7 scoring update on eight goals.", date: "February 7, 2026", image: "assets/news/goal-scorers-2025-26.png" },
    { id: "story-opening-fixtures", category: "Fixtures", title: "Opening fixtures published", body: "The 2026-27 fixture graphic is available for captains and players to follow matchday planning.", date: "May 1, 2026", image: "assets/news/fixture-26-27.png" },
    { id: "story-final-schedule", category: "Schedule", title: "Final schedule released", body: "BAFSL has shared the final schedule artwork for the 2026-27 season.", date: "May 1, 2026", image: "assets/news/final-schedule.png" }
  ],
  standingsOverrides: {
    "premier-2025-26-main": [
      { team: "svfc-2025", played: 6, won: 5, drawn: 0, lost: 1, gf: "-", ga: "-", gd: "-", points: 15 },
      { team: "kbfc-2025", played: 6, won: 4, drawn: 0, lost: 2, gf: "-", ga: "-", gd: "-", points: 12 },
      { team: "fcbb-2025", played: 6, won: 2, drawn: 0, lost: 4, gf: "-", ga: "-", gd: "-", points: 6 },
      { team: "stfc-2025", played: 6, won: 1, drawn: 0, lost: 5, gf: "-", ga: "-", gd: "-", points: 3 }
    ]
  },
  scorerOverrides: {
    "premier-2025-26-main": [
      { name: "Samuel", team: "SVFC", division: "premier-2025-26-main", total: 8 },
      { name: "Fahim", team: "KBFC", division: "premier-2025-26-main", total: 4 },
      { name: "Ornob", team: "SVFC", division: "premier-2025-26-main", total: 4 },
      { name: "Zahid", team: "FCBB", division: "premier-2025-26-main", total: 3 },
      { name: "Kevin", team: "SVFC", division: "premier-2025-26-main", total: 3 },
      { name: "Roman", team: "STFC", division: "premier-2025-26-main", total: 3 },
      { name: "Uzzal", team: "FCBB", division: "premier-2025-26-main", total: 3 },
      { name: "Albhee", team: "STFC", division: "premier-2025-26-main", total: 3 },
      { name: "Bappy", team: "KBFC", division: "premier-2025-26-main", total: 2 },
      { name: "Pablo", team: "FCBB", division: "premier-2025-26-main", total: 2 },
      { name: "Sirat", team: "FCBB", division: "premier-2025-26-main", total: 2 },
      { name: "Sumedh", team: "KBFC", division: "premier-2025-26-main", total: 2 }
    ]
  }
};

let state = loadState();

const els = {
  leagueTabs: document.querySelector("#leagueTabs"),
  seasonTabs: document.querySelector("#seasonTabs"),
  divisionTabs: document.querySelector("#divisionTabs"),
  selectedDivisionLabel: document.querySelector("#selectedDivisionLabel"),
  matchFilters: document.querySelector("#matchFilters"),
  matchList: document.querySelector("#matchList"),
  standingsBody: document.querySelector("#standingsBody"),
  teamGrid: document.querySelector("#teamGrid"),
  teamPage: document.querySelector("#teamPage"),
  scorerList: document.querySelector("#scorerList"),
  assistList: document.querySelector("#assistList"),
  leagueStats: document.querySelector("#leagueStats"),
  newsGrid: document.querySelector("#newsGrid"),
  nextMatchText: document.querySelector("#nextMatchText"),
  topScorerText: document.querySelector("#topScorerText"),
  goalCountText: document.querySelector("#goalCountText"),
  adminDialog: document.querySelector("#adminDialog"),
  loginForm: document.querySelector("#loginForm"),
  loginMessage: document.querySelector("#loginMessage"),
  adminWorkspace: document.querySelector("#adminWorkspace"),
  adminMessage: document.querySelector("#adminMessage"),
  scoreForm: document.querySelector("#scoreForm"),
  scoreMatchSelect: document.querySelector("#scoreMatchSelect"),
  fixtureForm: document.querySelector("#fixtureForm"),
  fixtureSelect: document.querySelector("#fixtureSelect"),
  fixtureDivision: document.querySelector("#fixtureDivision"),
  fixtureHome: document.querySelector("#fixtureHome"),
  fixtureAway: document.querySelector("#fixtureAway"),
  fixtureSubmit: document.querySelector("#fixtureSubmit"),
  newFixtureButton: document.querySelector("#newFixtureButton"),
  deleteFixtureButton: document.querySelector("#deleteFixtureButton"),
  teamForm: document.querySelector("#teamForm"),
  teamDivision: document.querySelector("#teamDivision"),
  storyForm: document.querySelector("#storyForm"),
  downloadDataButton: document.querySelector("#downloadDataButton")
};

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return structuredClone(defaultState);

  try {
    return { ...structuredClone(defaultState), ...JSON.parse(saved), adminLoggedIn: false };
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState(options = {}) {
  const toSave = { ...state, adminLoggedIn: false };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  if (options.sync) {
    syncStateToRemote();
  }
}

function remoteConfigured() {
  return Boolean(REMOTE_CONFIG.supabaseUrl && REMOTE_CONFIG.supabaseAnonKey);
}

function remoteEndpoint(query = "") {
  const baseUrl = REMOTE_CONFIG.supabaseUrl.replace(/\/$/, "");
  const table = REMOTE_CONFIG.table || "site_state";
  return `${baseUrl}/rest/v1/${table}${query}`;
}

function remoteHeaders(extra = {}) {
  return {
    apikey: REMOTE_CONFIG.supabaseAnonKey,
    Authorization: `Bearer ${REMOTE_CONFIG.supabaseAnonKey}`,
    "Content-Type": "application/json",
    ...extra
  };
}

async function loadRemoteState() {
  if (!remoteConfigured()) {
    return;
  }

  try {
    const recordId = REMOTE_CONFIG.recordId || "bafsl";
    const response = await fetch(remoteEndpoint(`?id=eq.${encodeURIComponent(recordId)}&select=data&limit=1`), {
      headers: remoteHeaders()
    });

    if (!response.ok) throw new Error("Remote data could not be loaded.");
    const rows = await response.json();
    if (rows[0]?.data) {
      state = { ...structuredClone(defaultState), ...rows[0].data, adminLoggedIn: false };
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, adminLoggedIn: false }));
      renderAll();
    }

    remoteReady = true;
    if (els.adminMessage) {
      els.adminMessage.textContent = "Cloud sync connected.";
    }
  } catch (error) {
    console.warn(error);
    remoteReady = false;
    if (els.adminMessage) {
      els.adminMessage.textContent = "Cloud sync is not connected. Changes are saved in this browser only.";
    }
  }
}

async function syncStateToRemote() {
  if (!remoteConfigured() || remoteSaving) {
    return;
  }

  if (!remoteAccessToken) {
    if (els.adminMessage) {
      els.adminMessage.textContent = "Saved locally. Sign in with the Supabase admin email to sync live.";
    }
    return;
  }

  remoteSaving = true;
  try {
    const recordId = REMOTE_CONFIG.recordId || "bafsl";
    const payload = {
      id: recordId,
      data: { ...state, adminLoggedIn: false },
      updated_at: new Date().toISOString()
    };

    const response = await fetch(remoteEndpoint("?on_conflict=id"), {
      method: "POST",
      headers: remoteHeaders({
        Authorization: `Bearer ${remoteAccessToken}`,
        Prefer: "resolution=merge-duplicates,return=minimal"
      }),
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error("Remote data could not be saved.");
    remoteReady = true;
    if (els.adminMessage) {
      els.adminMessage.textContent = "Saved locally and synced live.";
    }
  } catch (error) {
    console.warn(error);
    remoteReady = false;
    if (els.adminMessage) {
      els.adminMessage.textContent = "Saved locally, but cloud sync failed.";
    }
  } finally {
    remoteSaving = false;
  }
}

async function remoteLogin(email, password) {
  const baseUrl = REMOTE_CONFIG.supabaseUrl.replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: remoteHeaders(),
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) throw new Error("Supabase login failed.");
  const data = await response.json();
  remoteAccessToken = data.access_token || "";
  if (!remoteAccessToken) throw new Error("Supabase login did not return a token.");
}

function downloadStateBackup() {
  saveState();
  const backup = {
    exportedAt: new Date().toISOString(),
    storageKey: STORAGE_KEY,
    data: { ...state, adminLoggedIn: false }
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `bafsl-data-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function teamById(id) {
  return state.teams.find((team) => team.id === id) || { id: "tbd", name: "TBD", shortName: "TBD", roster: [] };
}

function leagueById(id) {
  return state.leagues.find((league) => league.id === id) || state.leagues[0];
}

function seasonById(id) {
  return state.seasons.find((season) => season.id === id) || state.seasons[0];
}

function divisionById(id) {
  return state.divisions.find((division) => division.id === id) || state.divisions[0];
}

function currentDivisions() {
  return state.divisions.filter((division) => division.league === state.selectedLeague && division.season === state.selectedSeason);
}

function currentTeams() {
  return state.teams.filter((team) => team.division === state.selectedDivision);
}

function currentMatches() {
  return state.matches.filter((match) => match.division === state.selectedDivision);
}

function formatDate(match) {
  const date = new Date(`${match.date}T${match.time || "12:00"}`);
  return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(date);
}

function formatTime(match) {
  const date = new Date(`${match.date}T${match.time || "12:00"}`);
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(date);
}

function slugify(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function storySlug(story) {
  if (!story.id) story.id = `story-${slugify(story.title)}-${Date.now().toString().slice(-5)}`;
  return story.id;
}

function absoluteUrl(hash = "") {
  const localHost = ["localhost", "127.0.0.1", ""].includes(window.location.hostname);
  const base = window.location.protocol === "file:" || localHost ? "https://bafsl.com/" : `${window.location.origin}${window.location.pathname}`;
  return `${base}${hash}`;
}

function escapeAttr(value) {
  return String(value || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function matchShareHash(match) {
  return `#match/${encodeURIComponent(match.id)}`;
}

function matchShareText(match) {
  const home = teamById(match.home);
  const away = teamById(match.away);
  const score = match.homeScore === null || match.awayScore === null ? "vs" : `${match.homeScore} - ${match.awayScore}`;
  const dateTime = `${formatDate(match)}${match.time ? `, ${formatTime(match)}` : ""}`;
  const venue = match.venue ? ` at ${match.venue}` : "";
  return `${home.name} ${score} ${away.name} | ${dateTime}${venue} | BAFSL`;
}

function matchShareUrl(match) {
  return absoluteUrl(matchShareHash(match));
}

function fallbackCopyText(text) {
  const field = document.createElement("textarea");
  field.value = text;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.left = "-9999px";
  document.body.appendChild(field);
  field.focus();
  field.select();
  field.setSelectionRange(0, field.value.length);
  const copied = document.execCommand("copy");
  field.remove();
  return copied;
}

async function copyMatchLink(button) {
  const match = state.matches.find((item) => item.id === button.dataset.shareMatch);
  if (!match) return;

  const url = matchShareUrl(match);
  let copied = false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      copied = true;
    }
  } catch {
    copied = false;
  }

  if (!copied) copied = fallbackCopyText(url);

  if (!copied) {
    window.prompt("Copy this match link", url);
    return;
  }

  button.classList.add("is-copied");
  button.setAttribute("aria-label", `Copied ${matchShareText(match)} link`);
  window.setTimeout(() => {
    button.classList.remove("is-copied");
    button.setAttribute("aria-label", `Copy ${matchShareText(match)} link`);
  }, 1400);
}

function teamLink(team, className = "") {
  return `<a class="${className}" href="#team/${team.id}">${team.name}</a>`;
}

function crestMarkup(team) {
  if (team.logo) {
    return `<span class="crest"><img src="${team.logo}" alt="" /></span>`;
  }
  return `<span class="crest">${team.shortName}</span>`;
}

function allEvents() {
  return state.matches.flatMap((match) => (match.events || []).map((event) => ({ ...event, match })));
}

function eventType(event) {
  return event.type || "goal";
}

function leaderboard(type) {
  if (type === "goals" && state.scorerOverrides?.[state.selectedDivision]) {
    return state.scorerOverrides[state.selectedDivision];
  }

  const totals = new Map();
  allEvents()
    .filter(({ match, type: rawType }) => match.division === state.selectedDivision && match.status === "completed" && eventType({ type: rawType }) === "goal")
    .forEach((event) => {
      const name = type === "goals" ? event.scorer : event.assist;
      if (!name) return;
      const key = `${event.team}:${name}`;
      totals.set(key, {
        name,
        team: teamById(event.team).name,
        division: event.match.division,
        total: (totals.get(key)?.total || 0) + 1
      });
    });
  return [...totals.values()].sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
}

function renderEventName(event) {
  const player = event.scorer || event.player || "";
  const assist = event.assist ? `<span class="assist-name">${event.assist}</span>` : "";
  return `<span class="event-names"><span class="event-player">${player}</span>${assist}</span>`;
}

function renderMatchEvents(match, open = false) {
  const events = match.events || [];
  if (!events.length) return "";

  let homeGoals = 0;
  let awayGoals = 0;
  const rows = events.map((event) => {
    const homeEvent = event.team === match.home;
    const type = eventType(event);
    const isGoal = type === "goal";
    const isRed = type === "red";

    if (isGoal) {
      if (homeEvent) homeGoals += 1;
      else awayGoals += 1;
    }

    const icon = isGoal ? `<span class="event-ball" aria-label="Goal"></span>` : `<span class="card-icon ${isRed ? "red" : "yellow"}" aria-label="${isRed ? "Red" : "Yellow"} card"></span>`;
    const detail = `<div class="event-detail ${homeEvent ? "home" : "away"}">${homeEvent ? `${renderEventName(event)}${icon}` : `${icon}${renderEventName(event)}`}</div>`;
    const center = isGoal ? `<strong>${homeGoals} - ${awayGoals}</strong>` : "";

    return `
      <div class="event-row">
        <div>${homeEvent ? detail : ""}</div>
        <div class="event-score">${center}</div>
        <div>${homeEvent ? "" : detail}</div>
      </div>
    `;
  }).join("");

  return `<div class="match-events" id="events-${match.id}" ${open ? "" : "hidden"}>${rows}</div>`;
}

function renderLeagueCenter() {
  els.leagueTabs.innerHTML = state.leagues.map((league) => `
    <div class="league-group">
      <button class="league-button ${league.id === state.selectedLeague ? "is-active" : ""}" type="button" data-league="${league.id}">
        ${league.name}
      </button>
      <div class="nested-season-list">
        ${state.seasons
          .filter((season) => season.league === league.id)
          .map((season) => `
            <button class="season-button ${season.id === state.selectedSeason ? "is-active" : ""}" type="button" data-league="${league.id}" data-season="${season.id}">
              ${season.name}
            </button>
          `).join("")}
      </div>
    </div>
  `).join("");

  els.seasonTabs.innerHTML = "";

  const divisions = currentDivisions();
  if (!divisions.some((division) => division.id === state.selectedDivision)) {
    state.selectedDivision = divisions[0]?.id || "";
  }

  els.divisionTabs.innerHTML = divisions.map((division) => `
    <button class="division-button ${division.id === state.selectedDivision ? "is-active" : ""}" type="button" data-division="${division.id}">
      ${division.name}
    </button>
  `).join("");

  els.selectedDivisionLabel.textContent = `${leagueById(state.selectedLeague).name} - ${seasonById(state.selectedSeason).name}`;
}

function renderMatches() {
  const matches = currentMatches()
    .filter((match) => state.selectedFilter === "all" || match.status === state.selectedFilter)
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));

  if (!matches.length) {
    els.matchList.innerHTML = `<p class="rank-meta">No matches found for this view.</p>`;
    return;
  }

  els.matchList.innerHTML = matches.map((match) => {
    const home = teamById(match.home);
    const away = teamById(match.away);
    const score = match.homeScore === null || match.awayScore === null ? "vs" : `${match.homeScore} - ${match.awayScore}`;
    const hasEvents = (match.events || []).length > 0;
    const scoreMarkup = hasEvents
      ? `<button class="score-toggle" type="button" data-match-toggle="${match.id}" aria-expanded="false" aria-controls="events-${match.id}">${score}</button>`
      : `<span>${score}</span>`;
    return `
      <article class="match-card">
        <button class="match-share-button" type="button" data-share-match="${match.id}" aria-label="Copy ${escapeAttr(matchShareText(match))} link" title="Copy match link"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 16.1c-.8 0-1.5.3-2 .8L8.9 12.7c.1-.2.1-.5.1-.7s0-.5-.1-.7L16 7.1c.5.5 1.2.8 2 .8 1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3c0 .2 0 .5.1.7L8 9.8C7.5 9.3 6.8 9 6 9c-1.7 0-3 1.3-3 3s1.3 3 3 3c.8 0 1.5-.3 2-.8l7.1 4.2c-.1.2-.1.4-.1.6 0 1.6 1.3 2.9 3 2.9s3-1.3 3-3-1.3-2.8-3-2.8Z" /></svg></button>
        <div class="match-meta">
          <strong>${formatDate(match)}</strong><br />
          ${match.time ? `${formatTime(match)}<br />` : ""}
          ${match.venue || "Venue TBA"}
          <span class="status-pill status-${match.status}">${match.status}</span>
        </div>
        <div class="team-side">
          ${crestMarkup(home)}
          <strong>${teamLink(home)}</strong>
        </div>
        <div class="scoreline">${scoreMarkup}</div>
        <div class="team-side away">
          <strong>${teamLink(away)}</strong>
          ${crestMarkup(away)}
        </div>
        ${renderMatchEvents(match)}
      </article>
    `;
  }).join("");
}

function renderTeams() {
  const teams = currentTeams();

  if (!teams.length) {
    els.teamGrid.innerHTML = `<p class="rank-meta">Teams for this season will be added soon.</p>`;
    return;
  }

  els.teamGrid.innerHTML = teams.map((team) => `
    <article class="team-card">
      <a href="#team/${team.id}" aria-label="Open ${team.name} team page">
        ${team.logo
          ? `<div class="team-logo"><img src="${team.logo}" alt="${team.name} logo" /></div>`
          : `<div class="team-logo fallback">${team.shortName}</div>`}
        <span class="mini-label">${divisionById(team.division).name}</span>
        <h3>${team.name}</h3>
        <p class="rank-meta">${team.roster?.length || 0} players</p>
      </a>
    </article>
  `).join("");
}

function calculateStandings(divisionId) {
  const override = state.standingsOverrides?.[divisionId];
  if (override) {
    return override.map((row) => ({ ...teamById(row.team), ...row }));
  }

  const rows = state.teams
    .filter((team) => team.division === divisionId)
    .map((team) => ({ ...team, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 }));

  state.matches
    .filter((match) => match.division === divisionId && match.status === "completed")
    .forEach((match) => {
      const home = rows.find((team) => team.id === match.home);
      const away = rows.find((team) => team.id === match.away);
      if (!home || !away) return;

      home.played += 1;
      away.played += 1;
      home.gf += match.homeScore || 0;
      home.ga += match.awayScore || 0;
      away.gf += match.awayScore || 0;
      away.ga += match.homeScore || 0;

      if (match.homeScore > match.awayScore) {
        home.won += 1;
        away.lost += 1;
        home.points += 3;
      } else if (match.homeScore < match.awayScore) {
        away.won += 1;
        home.lost += 1;
        away.points += 3;
      } else {
        home.drawn += 1;
        away.drawn += 1;
        home.points += 1;
        away.points += 1;
      }
    });

  rows.forEach((team) => {
    team.gd = team.gf - team.ga;
  });

  return rows.sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf || a.name.localeCompare(b.name));
}

function renderStandings() {
  const rows = calculateStandings(state.selectedDivision);
  if (!rows.length) {
    els.standingsBody.innerHTML = `<tr><td colspan="9">No teams found for this season.</td></tr>`;
    return;
  }

  els.standingsBody.innerHTML = rows.map((team) => `
    <tr>
      <td>
        <div class="club-cell">
          ${team.logo ? `<span class="crest"><img src="${team.logo}" alt="" /></span>` : `<span class="rank-number">${team.shortName.slice(0, 2)}</span>`}
          <span><strong>${teamLink(team)}</strong></span>
        </div>
      </td>
      <td>${team.played}</td>
      <td>${team.won}</td>
      <td>${team.drawn}</td>
      <td>${team.lost}</td>
      <td>${team.gf}</td>
      <td>${team.ga}</td>
      <td>${team.gd}</td>
      <td><strong>${team.points}</strong></td>
    </tr>
  `).join("");
}

function renderLeaderboard(target, rows, emptyText) {
  target.innerHTML = rows.length ? rows.slice(0, 8).map((player, index) => `
    <div class="rank-row">
      <span class="rank-number">${index + 1}</span>
      <div>
        <strong>${player.name}</strong>
        <div class="rank-meta">${player.team} &middot; ${divisionById(player.division).name}</div>
      </div>
      <span class="goals">${player.total}</span>
    </div>
  `).join("") : `<p class="rank-meta">${emptyText}</p>`;
}

function renderStats() {
  const completed = currentMatches().filter((match) => match.status === "completed");
  const scorerOverride = state.scorerOverrides?.[state.selectedDivision];
  const goals = scorerOverride ? scorerOverride.reduce((sum, player) => sum + player.total, 0) : completed.reduce((sum, match) => sum + (match.homeScore || 0) + (match.awayScore || 0), 0);
  const assists = allEvents().filter(({ match, assist, type }) => match.division === state.selectedDivision && match.status === "completed" && eventType({ type }) === "goal" && assist).length;
  const upcoming = currentMatches().filter((match) => match.status === "upcoming").length;
  const teams = currentTeams().length;
  const next = currentMatches()
    .filter((match) => match.status === "upcoming" || match.status === "live")
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))[0];
  const topScorer = leaderboard("goals")[0];

  renderLeaderboard(els.scorerList, leaderboard("goals"), "No goals yet. The Premier League season starts tomorrow.");
  renderLeaderboard(els.assistList, leaderboard("assists"), scorerOverride ? "Assist data was not included in the 2025-26 archive graphic." : "No assists yet. Add scorers and assists when results are updated.");

  els.leagueStats.innerHTML = [
    ["Total Goals", goals],
    ["Assists", assists],
    ["Teams", teams],
    ["Upcoming Fixtures", upcoming]
  ].map(([label, value]) => `
    <div class="stat-card">
      <span class="stat-value">${value}</span>
      <span class="rank-meta">${label}</span>
    </div>
  `).join("");

  els.nextMatchText.textContent = next ? `${teamById(next.home).name} vs ${teamById(next.away).name}` : "Schedule coming soon";
  els.topScorerText.textContent = topScorer ? `${topScorer.name}, ${topScorer.total}` : "No goals yet";
  els.goalCountText.textContent = `${goals} season goals`;
}

function renderNews() {
  els.newsGrid.innerHTML = state.news.map((item) => `
    <article class="news-card ${item.image ? "has-image" : ""}">
      <a class="news-card-link" href="#story/${storySlug(item)}">
        ${item.image ? `<img src="${item.image}" alt="${item.title}" />` : ""}
        <span class="news-card-body">
          <span class="mini-label">${item.category}</span>
          <span class="news-title">${item.title}</span>
          <span class="news-summary">${item.summary || item.body}</span>
        </span>
      </a>
      <span class="news-card-footer">
        <span class="rank-meta">${item.date}</span>
      </span>
    </article>
  `).join("");
}

function renderAdminOptions() {
  const divisionOptions = state.divisions.map((division) => `<option value="${division.id}">${leagueById(division.league).name} &middot; ${seasonById(division.season).name}</option>`).join("");
  els.fixtureDivision.innerHTML = divisionOptions;
  els.teamDivision.innerHTML = divisionOptions;
  els.fixtureDivision.value = state.selectedDivision;
  els.teamDivision.value = state.selectedDivision;

  els.scoreMatchSelect.innerHTML = state.matches.map((match) => `
    <option value="${match.id}">${divisionById(match.division).name}: ${teamById(match.home).name} vs ${teamById(match.away).name} (${formatDate(match)})</option>
  `).join("");

  const selectedFixture = els.fixtureSelect.value;
  els.fixtureSelect.innerHTML = `
    <option value="new">New fixture</option>
    ${state.matches.map((match) => `
      <option value="${match.id}">${divisionById(match.division).name}: ${teamById(match.home).name} vs ${teamById(match.away).name} (${formatDate(match)})</option>
    `).join("")}
  `;
  els.fixtureSelect.value = state.matches.some((match) => match.id === selectedFixture) ? selectedFixture : "new";

  renderFixtureTeamOptions();
  populateScoreForm();
  populateFixtureForm();
}

function renderFixtureTeamOptions() {
  const division = els.fixtureDivision.value;
  const options = state.teams
    .filter((team) => team.division === division)
    .map((team) => `<option value="${team.id}">${team.name}</option>`)
    .join("");
  els.fixtureHome.innerHTML = options;
  els.fixtureAway.innerHTML = options;
}

function populateFixtureForm() {
  const match = state.matches.find((item) => item.id === els.fixtureSelect.value);
  els.fixtureSubmit.textContent = match ? "Update Fixture" : "Add Fixture";
  els.deleteFixtureButton.disabled = !match;

  if (!match) {
    els.fixtureDivision.value = state.selectedDivision;
    renderFixtureTeamOptions();
    els.fixtureForm.elements.date.value = "";
    els.fixtureForm.elements.time.value = "";
    els.fixtureForm.elements.venue.value = "";
    return;
  }

  els.fixtureDivision.value = match.division;
  renderFixtureTeamOptions();
  els.fixtureForm.elements.date.value = match.date;
  els.fixtureForm.elements.time.value = match.time;
  els.fixtureForm.elements.venue.value = match.venue;
  els.fixtureHome.value = match.home;
  els.fixtureAway.value = match.away;
}

function parseEvents(value) {
  return String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(",").map((part) => part?.trim()).filter(Boolean);
      const first = String(parts[0] || "").toLowerCase();
      const hasExplicitType = ["goal", "yellow", "red"].includes(first);
      const type = hasExplicitType ? first : "goal";
      const teamName = hasExplicitType ? parts[1] : parts[0];
      const player = hasExplicitType ? parts[2] : parts[1];
      const assist = type === "goal" ? (hasExplicitType ? parts[3] : parts[2]) : "";
      const team = state.teams.find((item) => item.shortName.toLowerCase() === String(teamName).toLowerCase() || item.name.toLowerCase() === String(teamName).toLowerCase());
      return team && player ? { type, team: team.id, scorer: player, assist: assist || "" } : null;
    })
    .filter(Boolean);
}

function eventsToText(events = []) {
  return events.map((event) => `${eventType(event)}, ${teamById(event.team).shortName}, ${event.scorer || event.player}${event.assist ? `, ${event.assist}` : ""}`).join("\n");
}

function populateScoreForm() {
  const match = state.matches.find((item) => item.id === els.scoreMatchSelect.value);
  if (!match) return;
  els.scoreForm.elements.homeScore.value = match.homeScore ?? "";
  els.scoreForm.elements.awayScore.value = match.awayScore ?? "";
  els.scoreForm.elements.status.value = match.status;
  els.scoreForm.elements.events.value = eventsToText(match.events);
}

function renderTeamPage(teamId) {
  const team = teamById(teamId);
  const matches = state.matches
    .filter((match) => match.home === team.id || match.away === team.id)
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));

  els.teamPage.innerHTML = `
    <a class="back-link" href="#teams">&larr; Back to teams</a>
    <section class="team-hero">
      ${team.logo ? `<img src="${team.logo}" alt="${team.name} logo" />` : `<div class="team-logo fallback">${team.shortName}</div>`}
      <div>
        <span class="mini-label">${divisionById(team.division).name}</span>
        <h2>${team.name}</h2>
        <p class="rank-meta">${team.roster?.length || 0} players</p>
      </div>
    </section>
    <div class="team-detail-grid">
      <section class="panel">
        <div class="section-heading"><span>Schedule</span><h2>Recent Games</h2></div>
        <div class="match-list compact-list">
          ${matches.map((match) => {
            const opponent = team.id === match.home ? teamById(match.away) : teamById(match.home);
            const score = match.homeScore === null || match.awayScore === null ? "vs" : `${match.homeScore} - ${match.awayScore}`;
            return `<article class="mini-match"><strong>${formatDate(match)}</strong><span>${team.name} ${score} ${opponent.name}</span><span class="status-pill status-${match.status}">${match.status}</span></article>`;
          }).join("") || `<p class="rank-meta">No games scheduled yet.</p>`}
        </div>
      </section>
      <section class="panel">
        <div class="section-heading"><span>Players</span><h2>Current Roster</h2></div>
        <div class="roster-grid">
          ${(team.roster || []).map((player) => `<span>${player}</span>`).join("") || `<p class="rank-meta">Roster coming soon.</p>`}
        </div>
      </section>
    </div>
  `;
}

function renderMatchPage(matchId) {
  const match = state.matches.find((item) => item.id === decodeURIComponent(matchId));
  if (!match) {
    els.teamPage.innerHTML = `<a class="back-link" href="#fixtures">&larr; Back to fixtures</a><section class="panel"><p class="rank-meta">Match not found.</p></section>`;
    return;
  }

  const home = teamById(match.home);
  const away = teamById(match.away);
  const score = match.homeScore === null || match.awayScore === null ? "vs" : `${match.homeScore} - ${match.awayScore}`;
  const detailEvents = renderMatchEvents({ ...match, id: `detail-${match.id}` }, true) || `<p class="rank-meta">Score details will appear here after the match events are added.</p>`;

  els.teamPage.innerHTML = `
    <a class="back-link" href="#fixtures">&larr; Back to fixtures</a>
    <article class="match-detail-page">
      <div class="match-detail-meta">
        <strong>${formatDate(match)}</strong>
        ${match.time ? `<span>${formatTime(match)}</span>` : ""}
        ${match.venue ? `<span>${match.venue}</span>` : ""}
        <span class="status-pill status-${match.status}">${match.status}</span>
      </div>
      <div class="match-detail-score">
        <div class="team-side">
          ${crestMarkup(home)}
          <strong>${teamLink(home)}</strong>
        </div>
        <div class="scoreline featured-score"><span>${score}</span></div>
        <div class="team-side away">
          <strong>${teamLink(away)}</strong>
          ${crestMarkup(away)}
        </div>
      </div>
      ${detailEvents}
      <button class="match-share-button large" type="button" data-share-match="${match.id}" aria-label="Copy ${escapeAttr(matchShareText(match))} link" title="Copy match link"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 16.1c-.8 0-1.5.3-2 .8L8.9 12.7c.1-.2.1-.5.1-.7s0-.5-.1-.7L16 7.1c.5.5 1.2.8 2 .8 1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3c0 .2 0 .5.1.7L8 9.8C7.5 9.3 6.8 9 6 9c-1.7 0-3 1.3-3 3s1.3 3 3 3c.8 0 1.5-.3 2-.8l7.1 4.2c-.1.2-.1.4-.1.6 0 1.6 1.3 2.9 3 2.9s3-1.3 3-3-1.3-2.8-3-2.8Z" /></svg></button>
    </article>
  `;
}

function renderStoryPage(storyId) {
  const story = state.news.find((item) => storySlug(item) === storyId);
  if (!story) {
    els.teamPage.innerHTML = `<a class="back-link" href="#news">&larr; Back to stories</a><section class="panel"><p class="rank-meta">Story not found.</p></section>`;
    return;
  }

  els.teamPage.innerHTML = `
    <a class="back-link" href="#news">&larr; Back to stories</a>
    <article class="story-page">
      ${story.image ? `<img src="${story.image}" alt="${story.title}" />` : ""}
      <div class="story-content">
        <span class="mini-label">${story.category}</span>
        <h2>${story.title}</h2>
        <p class="rank-meta">${story.date}</p>
        <p>${story.body}</p>
      </div>
    </article>
  `;
}

function renderRoute() {
  const teamMatch = window.location.hash.match(/^#team\/(.+)$/);
  const storyMatch = window.location.hash.match(/^#story\/(.+)$/);
  const matchRoute = window.location.hash.match(/^#match\/(.+)$/);
  const homeSections = document.querySelectorAll("main > section:not(#teamPage)");

  if (teamMatch) {
    renderTeamPage(teamMatch[1]);
    els.teamPage.classList.remove("is-hidden");
    homeSections.forEach((section) => section.classList.add("is-hidden"));
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else if (storyMatch) {
    renderStoryPage(storyMatch[1]);
    els.teamPage.classList.remove("is-hidden");
    homeSections.forEach((section) => section.classList.add("is-hidden"));
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else if (matchRoute) {
    renderMatchPage(matchRoute[1]);
    els.teamPage.classList.remove("is-hidden");
    homeSections.forEach((section) => section.classList.add("is-hidden"));
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    els.teamPage.classList.add("is-hidden");
    homeSections.forEach((section) => section.classList.remove("is-hidden"));
  }
}

function renderAll() {
  renderLeagueCenter();
  renderMatches();
  renderTeams();
  renderStandings();
  renderStats();
  renderNews();
  renderAdminOptions();
  renderRoute();
}

function selectLeague(leagueId) {
  state.selectedLeague = leagueId;
  const season = state.seasons.find((item) => item.league === leagueId);
  state.selectedSeason = season?.id || "";
  const division = state.divisions.find((item) => item.league === leagueId && item.season === state.selectedSeason);
  state.selectedDivision = division?.id || "";
  saveState();
  renderAll();
}

document.querySelectorAll("#adminOpen, #adminOpenSecondary").forEach((button) => {
  button.addEventListener("click", () => {
    els.adminDialog.showModal();
    els.loginMessage.textContent = "";
    els.adminMessage.textContent = "";
  });
});

document.querySelector("#adminClose").addEventListener("click", () => els.adminDialog.close());

els.leagueTabs.addEventListener("click", (event) => {
  const seasonButton = event.target.closest("[data-season]");
  if (seasonButton) {
    state.selectedLeague = seasonButton.dataset.league;
    state.selectedSeason = seasonButton.dataset.season;
    const division = state.divisions.find((item) => item.league === state.selectedLeague && item.season === state.selectedSeason);
    state.selectedDivision = division?.id || "";
    saveState();
    renderAll();
    return;
  }

  const button = event.target.closest("[data-league]");
  if (!button) return;
  selectLeague(button.dataset.league);
});

els.seasonTabs.addEventListener("click", (event) => {
  const button = event.target.closest("[data-season]");
  if (!button) return;
  state.selectedSeason = button.dataset.season;
  const division = state.divisions.find((item) => item.league === state.selectedLeague && item.season === state.selectedSeason);
  state.selectedDivision = division?.id || "";
  saveState();
  renderAll();
});

els.divisionTabs.addEventListener("click", (event) => {
  const button = event.target.closest("[data-division]");
  if (!button) return;
  state.selectedDivision = button.dataset.division;
  saveState();
  renderAll();
});

els.matchFilters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-filter]");
  if (!button) return;
  state.selectedFilter = button.dataset.filter;
  document.querySelectorAll(".filter-button").forEach((item) => item.classList.toggle("is-active", item === button));
  renderMatches();
});

document.addEventListener("click", (event) => {
  const shareButton = event.target.closest("[data-share-match]");
  if (!shareButton) return;
  copyMatchLink(shareButton);
});

els.matchList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-match-toggle]");
  if (!button) return;

  const panel = document.querySelector(`#events-${button.dataset.matchToggle}`);
  if (!panel) return;

  const isOpen = button.getAttribute("aria-expanded") === "true";
  button.setAttribute("aria-expanded", String(!isOpen));
  panel.hidden = isOpen;
});

els.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const username = String(form.get("username")).trim();
  const password = String(form.get("password")).trim();

  if (remoteConfigured()) {
    try {
      await remoteLogin(username, password);
      state.adminLoggedIn = true;
      els.loginForm.classList.add("is-hidden");
      els.adminWorkspace.classList.remove("is-hidden");
      els.adminMessage.textContent = "Signed in. Live cloud updates are enabled.";
      return;
    } catch {
      els.loginMessage.textContent = "Cloud admin login failed. Use your Supabase admin email and password.";
      return;
    }
  }

  if (username === "admin" && password === "bafsl2026") {
    state.adminLoggedIn = true;
    els.loginForm.classList.add("is-hidden");
    els.adminWorkspace.classList.remove("is-hidden");
    els.adminMessage.textContent = "Signed in. Updates are saved in this browser only until cloud sync is configured.";
  } else {
    els.loginMessage.textContent = "Those credentials did not match.";
  }
});

document.querySelector(".admin-tabs").addEventListener("click", (event) => {
  const button = event.target.closest("[data-admin-view]");
  if (!button) return;
  document.querySelectorAll(".admin-tab").forEach((tab) => tab.classList.toggle("is-active", tab === button));
  document.querySelectorAll(".admin-view").forEach((view) => view.classList.toggle("is-hidden", view.dataset.view !== button.dataset.adminView));
});

els.scoreMatchSelect.addEventListener("change", populateScoreForm);

els.scoreForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const match = state.matches.find((item) => item.id === form.get("matchId"));
  if (!match) return;

  match.status = String(form.get("status"));
  if (match.status === "upcoming") {
    match.homeScore = null;
    match.awayScore = null;
    match.events = [];
  } else {
    match.homeScore = form.get("homeScore") === "" ? 0 : Number(form.get("homeScore"));
    match.awayScore = form.get("awayScore") === "" ? 0 : Number(form.get("awayScore"));
    match.events = parseEvents(form.get("events"));
  }
  saveState({ sync: true });
  renderAll();
  els.adminMessage.textContent = "Score, scorers, and assists updated.";
});

els.scoreForm.elements.status.addEventListener("change", () => {
  if (els.scoreForm.elements.status.value !== "upcoming") return;
  els.scoreForm.elements.homeScore.value = "";
  els.scoreForm.elements.awayScore.value = "";
  els.scoreForm.elements.events.value = "";
});

els.fixtureSelect.addEventListener("change", populateFixtureForm);

els.fixtureDivision.addEventListener("change", renderFixtureTeamOptions);

els.newFixtureButton.addEventListener("click", () => {
  els.fixtureForm.reset();
  els.fixtureSelect.value = "new";
  els.fixtureDivision.value = state.selectedDivision;
  renderFixtureTeamOptions();
  els.fixtureSubmit.textContent = "Add Fixture";
  els.deleteFixtureButton.disabled = true;
  els.adminMessage.textContent = "Ready to add a new fixture.";
});

els.deleteFixtureButton.addEventListener("click", () => {
  const fixtureId = els.fixtureSelect.value;
  const match = state.matches.find((item) => item.id === fixtureId);
  if (!match) {
    els.adminMessage.textContent = "Select an existing fixture to remove.";
    return;
  }

  state.matches = state.matches.filter((item) => item.id !== fixtureId);
  saveState({ sync: true });
  renderAll();
  els.adminMessage.textContent = "Fixture removed.";
});

els.fixtureForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const home = String(form.get("home"));
  const away = String(form.get("away"));
  const fixtureId = String(form.get("fixtureId"));

  if (home === away) {
    els.adminMessage.textContent = "Choose two different teams.";
    return;
  }

  const existingMatch = state.matches.find((match) => match.id === fixtureId);
  const fixtureData = {
    division: String(form.get("division")),
    date: String(form.get("date")),
    time: String(form.get("time") || ""),
    venue: String(form.get("venue") || "").trim(),
    home,
    away
  };

  if (existingMatch) {
    Object.assign(existingMatch, fixtureData);
    els.adminMessage.textContent = "Fixture updated.";
  } else {
    state.matches.push({
    id: `m-${Date.now()}`,
    ...fixtureData,
    homeScore: null,
    awayScore: null,
    status: "upcoming",
    events: []
    });
    els.adminMessage.textContent = "Fixture added.";
  }

  saveState({ sync: true });
  renderAll();
});

els.teamForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const name = String(form.get("name")).trim();
  const division = String(form.get("division"));
  const id = `${slugify(name)}-${Date.now().toString().slice(-4)}`;

  state.teams.push({
    id,
    division,
    name,
    shortName: String(form.get("shortName")).trim().toUpperCase(),
    roster: []
  });

  saveState({ sync: true });
  renderAll();
  event.currentTarget.reset();
  els.adminMessage.textContent = "Team added.";
});

els.storyForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const title = String(form.get("title")).trim();

  state.news.unshift({
    id: `story-${slugify(title)}-${Date.now().toString().slice(-5)}`,
    category: String(form.get("category")).trim(),
    title,
    summary: String(form.get("summary")).trim(),
    body: String(form.get("body")).trim(),
    date: String(form.get("date")).trim(),
    image: String(form.get("image") || "").trim()
  });

  saveState({ sync: true });
  renderAll();
  event.currentTarget.reset();
  els.adminMessage.textContent = "Story added.";
});

els.downloadDataButton.addEventListener("click", () => {
  downloadStateBackup();
  els.adminMessage.textContent = "Data backup downloaded.";
});

window.addEventListener("hashchange", renderRoute);

renderAll();
loadRemoteState();
