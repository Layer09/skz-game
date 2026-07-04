import { db, doc, setDoc, onSnapshot } from "./firebase.js";
import { listenState, listenPlayers, listenVotes, addPlayer } from "./game.js";
import { loadAlbums } from "./albums.js";

const app = document.getElementById("app");

let state = null;
let players = {};
let votes = {};
let me = localStorage.getItem("player_name");

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
   ROOT
========================= */

function render() {
  if (!me) return renderLogin();
  if (!state) return renderLoading();

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
  const used = Object.values(players).map(p => p.name);

  const available = ["Alice", "Bob", "Charlie", "Emma", "Julie"]
    .filter(n => !used.includes(n));

  app.innerHTML = `
    <div class="card">
      <h2>Choisis ton prénom</h2>
    </div>

    <div class="card">
      ${available.map(n => `
        <button onclick="select('${n}')">${n}</button>
      `).join("")}
    </div>
  `;

  window.select = async (name) => {
    const player = {
      id: name,
      name,
      color: getColor(name)
    };

    try {
      await addPlayer(player);
      me = name;
      localStorage.setItem("player_name", name);
      render();
    } catch (e) {
      alert("Nom déjà pris");
    }
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
   CATEGORY VOTE (MODIFIABLE)
========================= */

function renderCategory() {
  const myVote = votes.category?.[me];

  app.innerHTML = `
    <div class="card">
      <h2>📊 Catégorie</h2>
    </div>

    <div class="card">
      ${voteBtn("old", "Anciens (2018-2020)", myVote)}
      ${voteBtn("mid", "Mid Era (2021-2023)", myVote)}
      ${voteBtn("recent", "Récents (2024-2026)", myVote)}
    </div>
  `;
}

function voteBtn(value, label, myVote) {
  const player = players[me];
  const color = player?.color?.secondary || "#444";

  const active = myVote === value;

  return `
    <button
      onclick="voteCategory('${value}')"
      style="background:${active ? color : '#2a2a2a'}"
    >
      ${label}
    </button>
  `;
}

window.voteCategory = async (value) => {
  const current = votes.category || {};

  await setDoc(doc(db, "game", "votes"), {
    ...votes,
    category: {
      ...current,
      [me]: value
    }
  }, { merge: true });
};

/* =========================
   ALBUM VOTE (FIX BUG + FILTER OK)
========================= */

async function renderAlbum() {
  const albums = await loadAlbums();

  const opened = state.openedAlbums || [];

  const filtered = albums.filter(a =>
    a.era === state.currentCategory &&
    !opened.includes(a.id)
  );

  const myVote = votes.album?.[me];

  if (filtered.length === 0) {
    app.innerHTML = `
      <div class="card">
        ⚠️ Aucun album disponible
      </div>
    `;
    return;
  }

  app.innerHTML = `
    <div class="card">
      <h2>📀 Albums (${state.currentCategory})</h2>
    </div>

    ${filtered.map(a => albumCard(a, myVote)).join("")}
  `;
}

function albumCard(a, myVote) {
  const active = myVote === a.id;

  return `
    <div class="card">
      <img src="${a.cover}" style="width:100%;border-radius:12px">

      <h3>${a.name}</h3>
      <p>${a.year}</p>

      <button
        onclick="voteAlbum('${a.id}')"
        style="background:${active ? '#8B1E1E' : '#2a2a2a'}"
      >
        Voter
      </button>
    </div>
  `;
}

window.voteAlbum = async (id) => {
  const current = votes.album || {};

  await setDoc(doc(db, "game", "votes"), {
    ...votes,
    album: {
      ...current,
      [me]: id
    }
  }, { merge: true });
};

/* =========================
   HELPERS
========================= */

function renderLoading() {
  app.innerHTML = `<div class="card">Chargement...</div>`;
}

/* simple deterministic colors (temp V4) */
function getColor(name) {
  const map = {
    Alice: { primary: "#7EC8E3", secondary: "#2B4F81" },
    Bob: { primary: "#FF6B6B", secondary: "#8B1E1E" },
    Charlie: { primary: "#4CAF50", secondary: "#1B5E20" },
    Emma: { primary: "#B388FF", secondary: "#4A148C" },
    Julie: { primary: "#FF80AB", secondary: "#AD1457" }
  };

  return map[name] || { primary: "#999", secondary: "#444" };
}