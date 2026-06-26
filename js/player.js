import { db, doc, getDoc, updateDoc, onSnapshot } from "./firebase.js";
import { PLAYERS, ALBUMS, CATEGORIES } from "./data.js";
import { initGame } from "./init.js";

await initGame();

const app = document.getElementById("app");

let me = localStorage.getItem("player");
let state = {};

onSnapshot(doc(db,"game","state"), s=>{
  state = s.data();
  render();
});

if (!me) login();

function login(){
  app.innerHTML = `
    <div class="card">
      <h2>Choisis ton prénom</h2>
      ${PLAYERS.map(p=>`
        <button onclick="pick('${p.name}')"
          style="background:${p.dark}">
          ${p.name}
        </button>
      `).join("")}
    </div>
  `;

  window.pick = async (name)=>{

    const snap = await getDoc(doc(db,"game","players"));
    const players = snap.data();

    if(Object.values(players).includes(name)){
      alert("Déjà pris");
      return;
    }

    me = name;
    localStorage.setItem("player", me);

    await updateDoc(doc(db,"game","players"), {
      [name]: name
    });

    render();
  };
}

function render(){
  if(!me) return;

  if(state.phase==="category") category();
  else if(state.phase==="album") album();
  else app.innerHTML = `<div class="card">En attente...</div>`;
}

function category(){
  app.innerHTML = `
    <div class="card">
      <h2>Catégorie</h2>

      ${Object.entries(CATEGORIES).map(([k,v])=>`
        <button onclick="vote('${k}')">${v}</button>
      `).join("")}
    </div>
  `;

  window.vote = async (v)=>{
    await updateDoc(doc(db,"game","categoryVotes"), {
      [me]: v
    });
  };
}

function album(){
  const list = ALBUMS.filter(a =>
    a.era === state.currentCategory && !a.open
  );

  app.innerHTML = `
    <div class="card">
      <h2>Albums</h2>

      ${list.map(a=>`
        <button onclick="voteA('${a.id}')">
          ${a.name} (${a.year})
        </button>
      `).join("")}
    </div>
  `;

  window.voteA = async (id)=>{
    await updateDoc(doc(db,"game","albumVotes"), {
      [me]: id
    });
  };
}