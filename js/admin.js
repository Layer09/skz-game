import {
  db,
  doc,
  setDoc,
  onSnapshot
} from "./firebase.js";

import { listenGame, setPhase } from "./game.js";
import { countVotes, getTopVotes, pickRandom } from "./utils.js";
import { log } from "./logs.js";
import { getFinalRanking } from "./endgame.js";

const admin = document.getElementById("admin");

let state = {};
let players = {};
let categoryVotes = {};
let albumVotes = {};
let voteResult = null;

/* =========================
   LISTENERS
========================= */

listenGame((s) => {
  state = s;
  render();
});

onSnapshot(doc(db, "game", "players"), snap => {
  players = snap.data() || {};
  render();
});

onSnapshot(doc(db, "game", "categoryVotes"), snap => {
  categoryVotes = snap.data() || {};
  render();
});

onSnapshot(doc(db, "game", "albumVotes"), snap => {
  albumVotes = snap.data() || {};
  render();
});

onSnapshot(doc(db, "game", "voteResult"), snap => {
  voteResult = snap.data() || null;
  render();
});

/* =========================
   HELPERS
========================= */

function getPlayerList() {
  return Object.values(players).map(p => p.name);
}

function missingVotes(votes) {
  return Object.keys(players).filter(p => !votes[p]);
}

/* =========================
   RENDER
========================= */

function render() {
  if (!state) return;

  const missingCategory = missingVotes(categoryVotes);
  const missingAlbum = missingVotes(albumVotes);

  admin.innerHTML = `
    <div class="card">
      <h1>👑 ADMIN PANEL</h1>

      <button onclick="startCategory()">▶ Start Category Vote</button>
      <button onclick="resolveCategory()">⚡ Resolve Category</button>
      <button onclick="startAlbum()">▶ Start Album Vote</button>

      <button onclick="finishGame()">🏁 Finish Game</button>
      <button onclick="showRanking()">📊 Show Ranking</button>

      <button onclick="reset()">🔄 RESET SOIRÉE</button>
    </div>

    <div class="card">
      <h2>📊 État</h2>
      <p>Phase: <b>${state.phase}</b></p>
      <p>Catégorie actuelle: <b>${state.currentCategory || "-"}</b></p>
    </div>

    <div class="card">
      <h2>👥 Joueurs</h2>
      ${getPlayerList().map(p => `<div>• ${p}</div>`).join("")}
    </div>

    ${voteResult ? `
      <div class="card">
        <h2>📊 Résultat du vote</h2>

        ${Object.entries(voteResult.votes || {}).map(([k,v]) => `
          <div>${k} : ${v} votes</div>
        `).join("")}

        <hr>

        <div>🏆 Winner : <b>${voteResult.winner}</b></div>

        ${voteResult.tie ? `<div>🎲 Tie → random pick</div>` : ""}
      </div>
    ` : ""}

    <div class="card">
      <h2>🗳️ Votes catégorie</h2>
      <p><b>Manquants:</b></p>
      ${missingCategory.map(m => `<div style="color:red">• ${m}</div>`).join("")}

      <p><b>Votes:</b></p>
      ${Object.entries(categoryVotes).map(([k,v]) => `
        <div>${k} → ${v}</div>
      `).join("")}
    </div>

    <div class="card">
      <h2>📀 Votes album</h2>
      <p><b>Manquants:</b></p>
      ${missingAlbum.map(m => `<div style="color:red">• ${m}</div>`).join("")}

      <p><b>Votes:</b></p>
      ${Object.entries(albumVotes).map(([k,v]) => `
        <div>${k} → ${v}</div>
      `).join("")}
    </div>
  `;

  window.startCategory = startCategory;
  window.resolveCategory = resolveCategory;
  window.startAlbum = startAlbum;
  window.finishGame = finishGame;
  window.showRanking = showRanking;
  window.reset = reset;
}

/* =========================
   CATEGORY FLOW
========================= */

async function startCategory() {
  await setPhase("category", {
    currentCategory: null,
    currentAlbum: null
  });

  await setDoc(doc(db, "game", "categoryVotes"), {});
  await setDoc(doc(db, "game", "voteResult"), null);

  await log("🎮 Start category vote");
}

async function resolveCategory() {
  const counts = countVotes(categoryVotes);
  const top = getTopVotes(counts);
  const winner = pickRandom(top);

  if (!winner) {
    console.error("No winner computed");
    return;
  }

  await setDoc(doc(db, "game", "voteResult"), {
    type: "category",
    votes: counts,
    winner,
    tie: top.length > 1
  });

  await setPhase("album", {
    currentCategory: winner
  });

  await log(`⚡ Category resolved: ${winner}`);
}

/* =========================
   ALBUM FLOW
========================= */

async function startAlbum() {
  if (!state.currentCategory) {
    alert("Résous la catégorie d'abord");
    return;
  }

  await setPhase("album");

  await setDoc(doc(db, "game", "albumVotes"), {});
  await setDoc(doc(db, "game", "voteResult"), null);

  await log("📀 Start album vote");
}

/* =========================
   END GAME
========================= */

async function finishGame() {
  await log("🏁 FIN DE PARTIE");

  const ranking = await getFinalRanking();

  await log("----- CLASSEMENT FINAL -----");

  ranking.forEach(([name, score], i) => {
    log(`${i + 1}. ${name} - ${score} points`);
  });

  alert("Game finished");
}

async function showRanking() {
  const ranking = await getFinalRanking();

  alert(
    ranking.map(([n,s], i) => `${i+1}. ${n} - ${s}`).join("\n")
  );
}

/* =========================
   RESET
========================= */

async function reset() {
  if (!confirm("RESET SOIRÉE ?")) return;

  await setPhase("lobby", {
    currentCategory: null,
    currentAlbum: null
  });

  await setDoc(doc(db, "game", "players"), {});
  await setDoc(doc(db, "game", "categoryVotes"), {});
  await setDoc(doc(db, "game", "albumVotes"), {});
  await setDoc(doc(db, "game", "voteResult"), null);

  await log("🔄 RESET SOIRÉE");
}