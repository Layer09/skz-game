import { db, doc, setDoc, onSnapshot } from "./firebase.js";
import { addPlayer, listenState, listenPlayers } from "./game.js";
import { loadAlbums } from "./albums.js";
import { getPlayerPrimaryColor, getPlayerColor } from "./players.js";

const app = document.getElementById("app");

let state = null;
let players = {};
let me = localStorage.getItem("player_name");

let categoryVotes = {};
let albumVotes = {};

/* =========================
   LISTEN STATE
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
  const data = snap.data() || {};
  categoryVotes = data.category || {};
  albumVotes = data.album || {};
  render();
});

/* =========================
   RENDER ROOT
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
    case "albumResolved":
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
    await addPlayer({
      id: name.toLowerCase(),
      name
    });

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
      <h2>⏳ En attente du host</h2>
      <p>${me}</p>
    </div>
  `;
}

/* =========================
   CATEGORY VOTE
========================= */

function renderCategory() {
  const already = categoryVotes?.[me];
  const myColor = getPlayerPrimaryColor(players, me);

  app.innerHTML = `
    <div class="card">
      <h2>📊 Catégorie</h2>
    </div>

    <div class="card">
      <button style="background:${myColor}" ${already ? "disabled" : ""} onclick="vote('old')">
        Anciens (2018-2020)
      </button>

      <button style="background:${myColor}" ${already ? "disabled" : ""} onclick="vote('mid')">
        Mid (2021-2023)
      </button>

      <button style="background:${myColor}" ${already ? "disabled" : ""} onclick="vote('recent')">
        Recent (2024-2026)
      </button>
    </div>

    <div class="card">
      <h3>Votes</h3>
      ${Object.entries(categoryVotes).map(([k,v]) => `
        <div>${k} → ${v}</div>
      `).join("")}
    </div>
  `;

  window.vote = async (value) => {
    await setDoc(doc(db, "game", "votes"), {
      category: {
        ...categoryVotes,
        [me]: value
      },
      album: albumVotes
    }, { merge: true });
  };
}

/* =========================
   ALBUM VOTE
========================= */

async function renderAlbum() {
  const albums = await loadAlbums();

  const filtered = albums.filter(a =>
    a.era === state.currentCategory &&
    !(state.openedAlbums || []).includes(a.id)
  );

  const already = albumVotes?.[me];
  const myColor = getPlayerColor(players, me);

  app.innerHTML = `
    <div class="card">
      <h2>📀 Albums (${state.currentCategory})</h2>
    </div>

    ${filtered.length === 0 ? `
      <div class="card">
        ⚠️ Aucun album disponible
      </div>
    ` : filtered.map(a => `
      <div class="card">
        <img src="${a.cover}" style="width:100%;border-radius:12px">
        <h3>${a.name}</h3>
        <p>${a.year}</p>

        <button style="background:${myColor}" ${already ? "disabled" : ""} onclick="voteAlbum('${a.id}')">
          Voter
        </button>
      </div>
    `).join("")}

    <div class="card">
      <h3>Votes</h3>
      ${Object.entries(albumVotes).map(([k,v]) => `
        <div>${k} → ${v}</div>
      `).join("")}
    </div>
  `;

  window.voteAlbum = async (id) => {
    await setDoc(doc(db, "game", "votes"), {
      category: categoryVotes,
      album: {
        ...albumVotes,
        [me]: id
      }
    }, { merge: true });
  };
}