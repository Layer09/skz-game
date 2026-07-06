import {
  db,
  doc,
  setDoc,
  onSnapshot
} from "./firebase.js";

import { listenState, listenPlayers } from "./game.js";
import { countVotes, getTopVotes, pickRandom } from "./utils.js";
import { log } from "./logs.js";
import { addPoints, getRanking } from "./scoring.js";

const admin = document.getElementById("admin");

let state = null;
let players = {};
let votes = {};
let voteResult = null;

/* =========================
   LISTENERS
========================= */

listenState((s) => {
  state = s;
  render();
});

listenPlayers((p) => {
  players = p || {};
  render();
});

onSnapshot(doc(db, "game", "votes"), snap => {
  votes = snap.data() || {};
  render();
});

onSnapshot(doc(db, "game", "voteResult"), snap => {
  voteResult = snap.data() || null;
  render();
});

/* =========================
   RENDER
========================= */

function render() {
  if (!state) return;

  const categoryVotes = votes.category || {};
  const albumVotes = votes.album || {};

  admin.innerHTML = `
    <div class="card">
      <h1>👑 ADMIN PANEL</h1>

      <button onclick="startCategory()">▶ Start Category Vote</button>
      <button onclick="resolveCategory()">⚡ Resolve Category</button>

      <button onclick="startAlbum()">▶ Start Album Vote</button>
      <button onclick="resolveAlbum()">⚡ Resolve Album</button>

      <button onclick="finishGame()">🏁 Finish Game</button>
      <button onclick="showRanking()">📊 Show Ranking</button>

      <button onclick="reset()">🔄 Reset Game</button>
    </div>

    <div class="card">
      <h2>📊 State</h2>
      <p>Phase: ${state.phase}</p>
      <p>Category: ${state.currentCategory || "-"}</p>
      <p>Album: ${state.currentAlbum || "-"}</p>
    </div>

    <div class="card">
      <h2>🗳️ Category votes</h2>
      ${Object.entries(categoryVotes).map(([k,v]) => `
        <div>${k} → ${v}</div>
      `).join("")}
    </div>

    <div class="card">
      <h2>📀 Album votes</h2>
      ${Object.entries(albumVotes).map(([k,v]) => `
        <div>${k} → ${v}</div>
      `).join("")}
    </div>

    ${voteResult ? `
      <div class="card">
        <h2>🏆 Last Result</h2>
        <div>Type: ${voteResult.type}</div>
        <div>Winner: <b>${voteResult.winner}</b></div>
        <pre>${JSON.stringify(voteResult.votes, null, 2)}</pre>
      </div>
    ` : ""}
  `;

  window.startCategory = startCategory;
  window.resolveCategory = resolveCategory;
  window.startAlbum = startAlbum;
  window.resolveAlbum = resolveAlbum;
  window.finishGame = finishGame;
  window.showRanking = showRanking;
  window.reset = reset;
}

/* =========================
   START CATEGORY
========================= */

async function startCategory() {
  await setDoc(doc(db, "game", "votes"), {
    category: {},
    album: {}
  });

  await setDoc(doc(db, "game", "state"), {
    ...state,
    phase: "category",
    currentCategory: null,
    currentAlbum: null
  });

  await log("🎮 Category vote started");
}

/* =========================
   RESOLVE CATEGORY
========================= */

async function resolveCategory() {
  const categoryVotes = votes.category || {};

  const counts = countVotes(categoryVotes);
  const top = getTopVotes(counts);
  const winner = pickRandom(top);

  await setDoc(doc(db, "game", "state"), {
    ...state,
    currentCategory: winner,
    phase: "album"
  });

  await setDoc(doc(db, "game", "voteResult"), {
    type: "category",
    votes: counts,
    winner
  });

  await log(`⚡ Category resolved: ${winner}`);
}

/* =========================
   START ALBUM
========================= */

async function startAlbum() {
  if (!state.currentCategory) {
    alert("Resolve category first");
    return;
  }

  await setDoc(doc(db, "game", "votes"), {
    ...votes,
    album: {}
  });

  await setDoc(doc(db, "game", "state"), {
    ...state,
    phase: "album"
  });

  await log("📀 Album vote started");
}

/* =========================
   RESOLVE ALBUM
========================= */

async function resolveAlbum() {
  const albumVotes = votes.album || {};

  const counts = countVotes(albumVotes);
  const top = getTopVotes(counts);
  const winner = pickRandom(top);

  await setDoc(doc(db, "game", "state"), {
    ...state,
    currentAlbum: winner
  });

  await setDoc(doc(db, "game", "voteResult"), {
    type: "album",
    votes: counts,
    winner
  });

  await log(`📀 Album resolved: ${winner}`);

  // points simples
  const points = {};
  for (const p of Object.keys(players)) {
    if (albumVotes[p] === winner) {
      points[p] = 1;
    }
  }

  await addPoints(points);
}

/* =========================
   FINISH GAME
========================= */

async function finishGame() {
  await log("🏁 GAME FINISHED");
  alert("Game finished");
}

/* =========================
   SHOW RANKING
========================= */

async function showRanking() {
  const ranking = await getRanking();

  let text = "🏆 RANKING\n\n";

  ranking.forEach(([name, score], i) => {
    text += `${i + 1}. ${name} - ${score}\n`;
  });

  alert(text);
}

/* =========================
   RESET
========================= */

async function reset() {
  if (!confirm("Reset game ?")) return;

  await setDoc(doc(db, "game", "state"), {
    phase: "lobby",
    round: 0,
    currentCategory: null,
    currentAlbum: null,
    locked: false,
    openedAlbums: []
  });

  await setDoc(doc(db, "game", "players"), {});
  await setDoc(doc(db, "game", "votes"), {});
  await setDoc(doc(db, "game", "scores"), {});
  await setDoc(doc(db, "game", "voteResult"), {});

  await log("🔄 RESET GAME");
}