import { db, doc, setDoc, onSnapshot } from "./firebase.js";
import { addPlayer, listenGame } from "./game.js";

import albumsData from "../data/albums.json" assert { type: "json" };

const app = document.getElementById("app");

let state = null;
let me = localStorage.getItem("player_name");

let players = {};
let categoryVotes = {};
let albumVotes = {};
let voteResult = null;

/* =========================
   LISTEN STATE
========================= */

listenGame((s) => {
  state = s || {};
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
   ROOT RENDER
========================= */

function render() {
  if (!me) return renderLogin();

  if (!state) {
    app.innerHTML = `<div class="card">Chargement...</div>`;
    return;
  }

  switch (state.phase) {
    case "lobby":
      return renderLobby();

    case "category":
    case "categoryResolved":
      return renderCategory();

    case "album":
      return renderAlbum();

    default:
      app.innerHTML = `<div class="card">En attente...</div>`;
  }
}

/* =========================
   LOGIN
========================= */

function renderLogin() {
  const usedNames = Object.values(players).map(p => p.name);

  const available = ["Alice", "Bob", "Charlie", "Emma", "Julie"]
    .filter(n => !usedNames.includes(n));

  app.innerHTML = `
    <div class="card">
      <h2>Choisis ton prénom</h2>
    </div>

    <div class="card">
      ${available.map(name => `
        <button onclick="select('${name}')">${name}</button>
      `).join("")}
    </div>
  `;

  window.select = async (name) => {
    await addPlayer(name);
    me = name;
    localStorage.setItem("player_name", name);
    render();
  };
}

/* =========================
   LOBBY
========================= */

function renderLobby() {
  app.innerHTML = `
    <div class="card">
      <h2>⏳ En attente du host...</h2>
      <p>${me}</p>
    </div>
  `;
}

/* =========================
   CATEGORY
========================= */

function renderCategory() {
  const alreadyVoted = categoryVotes?.[me];

  app.innerHTML = `
    <div class="card">
      <h2>📊 Catégorie</h2>
    </div>

    <div class="card">
      <button ${alreadyVoted ? "disabled" : ""} onclick="vote('old')">
        Anciens (2018-2020)
      </button>

      <button ${alreadyVoted ? "disabled" : ""} onclick="vote('mid')">
        Mid Era (2021-2023)
      </button>

      <button ${alreadyVoted ? "disabled" : ""} onclick="vote('recent')">
        Récents (2024-2026)
      </button>
    </div>

    <div class="card">
      <h3>Votes en cours</h3>
      ${Object.entries(categoryVotes).map(([k, v]) => `
        <div>${k} → ${v}</div>
      `).join("")}
    </div>
  `;

  window.vote = async (v) => {
    if (categoryVotes?.[me]) return;

    await setDoc(doc(db, "game", "categoryVotes"), {
      ...categoryVotes,
      [me]: v
    }, { merge: true });
  };
}

/* =========================
   ALBUM (FIX FINAL)
========================= */

function renderAlbum() {
  const category = (state.currentCategory || "").trim();

  const filtered = albumsData.filter(a => a.era === category);

  const alreadyVoted = albumVotes?.[me];

  if (!filtered.length) {
    app.innerHTML = `
      <div class="card">
        <h2>📀 Albums</h2>
        <p>⚠️ Aucun album disponible</p>
        <p>Catégorie : <b>${category}</b></p>
      </div>
    `;
    return;
  }

  app.innerHTML = `
    <div class="card">
      <h2>📀 Albums (${category})</h2>
    </div>

    ${filtered.map(a => `
      <div class="card">
        <img src="${a.cover}" style="width:100%;border-radius:12px">
        <h3>${a.name}</h3>
        <p>${a.year}</p>

        <button ${alreadyVoted ? "disabled" : ""} onclick="voteAlbum('${a.id}')">
          Voter
        </button>
      </div>
    `).join("")}
  `;

  window.voteAlbum = async (id) => {
    if (albumVotes?.[me]) return;

    await setDoc(doc(db, "game", "albumVotes"), {
      ...albumVotes,
      [me]: id
    }, { merge: true });
  };
}