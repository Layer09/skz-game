import { db, doc, setDoc, onSnapshot } from "./firebase.js";
import { listenState, listenPlayers, listenVotes, setState } from "./game.js";
import { loadAlbums } from "./albums.js";
import { countVotes, getTopVotes, pickRandom } from "./utils.js";
import { log } from "./logs.js";

const admin = document.getElementById("admin");

let state = null;
let players = {};
let votes = {};

/* =========================
   LISTENERS
========================= */

listenState(s => {
  state = s;
  render();
});

listenPlayers(p => {
  players = p;
  render();
});

listenVotes(v => {
  votes = v;
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
      <h1>👑 ADMIN V4</h1>

      <button onclick="startCategory()">▶ Start Category</button>
      <button onclick="resolveCategory()">⚡ Resolve Category</button>

      <button onclick="startAlbum()">▶ Start Album</button>
      <button onclick="resolveAlbum()">📀 Resolve Album</button>

      <button onclick="resetGame()">🔄 RESET</button>
    </div>

    <div class="card">
      <h2>📊 STATE</h2>
      <p>Phase: ${state.phase}</p>
      <p>Catégorie: ${state.currentCategory || "-"}</p>
    </div>

    <div class="card">
      <h2>👥 Joueurs</h2>
      ${Object.values(players).map(p => `<div>• ${p.name}</div>`).join("")}
    </div>

    <div class="card">
      <h2>🗳 Category votes</h2>
      ${Object.entries(categoryVotes).map(([k,v]) =>
        `<div>${k} → ${v}</div>`
      ).join("")}
    </div>

    <div class="card">
      <h2>📀 Album votes</h2>
      ${Object.entries(albumVotes).map(([k,v]) =>
        `<div>${k} → ${v}</div>`
      ).join("")}
    </div>
  `;

  window.startCategory = startCategory;
  window.resolveCategory = resolveCategory;
  window.startAlbum = startAlbum;
  window.resolveAlbum = resolveAlbum;
  window.resetGame = resetGame;
}

async function startCategory() {
  await setState({
    phase: "category",
    currentCategory: null,
    currentAlbum: null
  });

  await setDoc(doc(db, "game", "votes"), {
    category: {},
    album: {}
  });

  await log("🎮 Start category vote");
}

async function resolveCategory() {
  const categoryVotes = votes.category || {};

  const counts = countVotes(categoryVotes);
  const top = getTopVotes(counts);
  const winner = pickRandom(top);

  await setState({
    phase: "categoryResolved",
    currentCategory: winner
  });

  await log(`⚡ Category resolved: ${winner}`);
}

async function startAlbum() {
  if (!state.currentCategory) {
    alert("Resolve category first");
    return;
  }

  await setState({
    phase: "album"
  });

  await setDoc(doc(db, "game", "votes"), {
    ...votes,
    album: {}
  });

  await log("▶ Start album vote");
}

async function resolveAlbum() {
  const albums = await loadAlbums();

  const albumVotes = votes.album || {};

  const counts = countVotes(albumVotes);
  const top = getTopVotes(counts);

  const winner = pickRandom(top);

  const opened = state.openedAlbums || [];

  const updatedOpened = [...opened, winner];

  await setState({
    phase: "albumResolved",
    currentAlbum: winner,
    openedAlbums: updatedOpened
  });

  await log(`📀 Album resolved: ${winner}`);
}

async function resetGame() {
  if (!confirm("RESET COMPLET ?")) return;

  await setState({
    phase: "lobby",
    round: 0,
    currentCategory: null,
    currentAlbum: null,
    openedAlbums: [],
    locked: false,
    voteResult: null
  });

  await setDoc(doc(db, "game", "players"), {});
  await setDoc(doc(db, "game", "votes"), {
    category: {},
    album: {}
  });

  await setDoc(doc(db, "game", "scores"), {});

  await log("🔄 RESET GAME");
}

async function endRound() {
  const categoryWinner = state.currentCategory;
  const albumWinner = state.currentAlbum;

  const categoryVotes = votes.category || {};
  const albumVotes = votes.album || {};

  const results = {};

  Object.keys(players).forEach(p => {
    results[p] = {
      categoryCorrect: categoryVotes[p] === categoryWinner,
      albumCorrect: albumVotes[p] === albumWinner
    };
  });

  await addRoundScores(results);

  await log("🏁 Round terminé + scores calculés");

  await setDoc(doc(db, "game", "votes"), {
    category: {},
    album: {}
  });
}
