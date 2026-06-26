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

/* =========================
   LISTEN STATE
========================= */

listenGame((s) => {
  state = s;
  render();
});

onSnapshot(doc(db, "game", "players"), snap => {
  players = snap.data() || {};
  render(); // 🔥 IMPORTANT FIX
});

onSnapshot(doc(db, "game", "categoryVotes"), snap => {
  categoryVotes = snap.data() || {};
  render();
});

onSnapshot(doc(db, "game", "albumVotes"), snap => {
  albumVotes = snap.data() || {};
  render();
});

/* =========================
   HELPERS
========================= */

function getPlayerList() {
  return Object.values(players)
    .map(p => typeof p === "string" ? p : p.name);
}

/* =========================
   RENDER
========================= */

function render() {
  if (!state) return;

  const missingCategory = Object.keys(players)
    .filter(p => !categoryVotes[p]);

  const missingAlbum = Object.keys(players)
    .filter(p => !albumVotes[p]);

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
      <p>Round: ${state.round || 0}</p>
    </div>

    <div class="card">
      <h2>👥 Joueurs connectés</h2>
      ${getPlayerList().length
        ? getPlayerList().map(p => `<div>• ${p}</div>`).join("")
        : "<p>Aucun joueur</p>"
      }
    </div>

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
  window.reset = reset;
  window.finishGame = finishGame;
  window.showRanking = showRanking;
}

/* =========================
   GAME FLOW
========================= */

async function startCategory() {
  await setPhase("category");
  await setDoc(doc(db, "game", "categoryVotes"), {});
  await log("🎮 Start category vote");
}

async function resolveCategory() {
  const counts = countVotes(categoryVotes);
  const top = getTopVotes(counts);
  const chosen = pickRandom(top);

  await setPhase("categoryResolved", {
    currentCategory: chosen
  });

  await log(`⚡ Category resolved: ${chosen}`);
}

async function startAlbum() {
  if (!state.currentCategory) {
    alert("Résous la catégorie d'abord");
    return;
  }

  await setPhase("album");
  await setDoc(doc(db, "game", "albumVotes"), {});

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

  let text = "CLASSEMENT FINAL\n\n";

  ranking.forEach(([name, score], i) => {
    text += `${i + 1}. ${name} - ${score}\n`;
  });

  alert(text);
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

  await log("🔄 RESET SOIRÉE");
}