import { db, doc, getDoc, setDoc, updateDoc, onSnapshot } from "./firebase.js";
import { addPlayer, listenGame } from "./game.js";
import { countVotes } from "./utils.js";

const app = document.getElementById("app");

let state = null;
let me = localStorage.getItem("player_name");

let players = {};
let categoryVotes = {};
let albumVotes = {};

/* =========================
   INIT LIVE STATE
========================= */

listenGame((s) => {
  state = s;
  render();
});

onSnapshot(doc(db, "game", "players"), snap => {
  players = snap.data() || {};
});

onSnapshot(doc(db, "game", "categoryVotes"), snap => {
  categoryVotes = snap.data() || {};
});

onSnapshot(doc(db, "game", "albumVotes"), snap => {
  albumVotes = snap.data() || {};
});

/* =========================
   LOGIN
========================= */

function render() {
  if (!me) return renderLogin();

  if (!state) {
    app.innerHTML = `<div class="card">Chargement...</div>`;
    return;
  }

  if (state.phase === "lobby") return renderLobby();
  if (state.phase === "category") return renderCategory();
  if (state.phase === "album") return renderAlbum();

  app.innerHTML = `<div class="card">En attente de l'admin...</div>`;
}

/* =========================
   LOGIN SCREEN
========================= */

function renderLogin() {
  app.innerHTML = `
    <div class="card">
      <h2>Choisis ton prénom</h2>
      <p>⚠️ un seul joueur par prénom</p>
    </div>

    <div class="card">
      ${["Alice","Bob","Charlie","Emma","Julie"].map(name => `
        <button onclick="select('${name}')">${name}</button>
      `).join("")}
    </div>
  `;

  window.select = async (name) => {
    try {
      await addPlayer(name);
      me = name;
      localStorage.setItem("player_name", name);
      render();
    } catch (e) {
      alert("Nom déjà utilisé");
    }
  };
}

/* =========================
   LOBBY
========================= */

function renderLobby() {
  app.innerHTML = `
    <div class="card">
      <h2>En attente de la partie</h2>
      <p>Connecté en tant que <b>${me}</b></p>
    </div>
  `;
}

/* =========================
   CATEGORY VOTE
========================= */

function renderCategory() {
  const alreadyVoted = categoryVotes[me];

  app.innerHTML = `
    <div class="card">
      <h2>Catégorie d'album</h2>
      ${alreadyVoted ? `<p>Vote enregistré ✔</p>` : ""}
    </div>

    <div class="card">
      <button onclick="vote('old')">Anciens (2018-2020)</button>
      <button onclick="vote('mid')">Mid Era (2021-2023)</button>
      <button onclick="vote('recent')">Récents (2024-2026)</button>
    </div>
  `;

  window.vote = async (v) => {
    if (categoryVotes[me]) return;

    await updateDoc(doc(db, "game", "categoryVotes"), {
      [me]: v
    });
  };
}

/* =========================
   ALBUM VOTE
========================= */

function renderAlbum() {
  const already = albumVotes[me];

  const albums = state.availableAlbums || [];

  app.innerHTML = `
    <div class="card">
      <h2>Choisis l'album</h2>
      ${already ? `<p>Vote enregistré ✔</p>` : ""}
    </div>

    <div class="card">
      ${albums.map(a => `
        <button onclick="voteAlbum('${a.id}')">
          📀 ${a.name} (${a.year})
        </button>
      `).join("")}
    </div>
  `;

  window.voteAlbum = async (id) => {
    if (albumVotes[me]) return;

    await updateDoc(doc(db, "game", "albumVotes"), {
      [me]: id
    });
  };
}