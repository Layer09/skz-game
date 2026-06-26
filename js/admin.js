import {
  db,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  collection,
  addDoc
} from "./firebase.js";

import { log } from "./logs.js";

const admin = document.getElementById("admin");

let state={}, players={}, catVotes={}, logs=[];

onSnapshot(doc(db,"game","state"), s=>{state=s.data();render();});
onSnapshot(doc(db,"game","players"), s=>{players=s.data();render();});
onSnapshot(doc(db,"game","categoryVotes"), s=>{catVotes=s.data();});

function render(){

  const missing = Object.keys(players)
    .filter(p=>!catVotes[p]);

  admin.innerHTML = `
    <div class="card">
      <h1>ADMIN</h1>

      <button onclick="startCat()">Start catégorie</button>
      <button onclick="startAlbum()">Start album</button>
      <button onclick="reset()">RESET SOIRÉE</button>
    </div>

    <div class="card">
      <h2>Joueurs</h2>
      ${Object.keys(players).map(p=>`<div>${p}</div>`).join("")}
    </div>

    <div class="card">
      <h2>Votes catégorie</h2>

      <p><b>Voté :</b></p>
      ${Object.keys(catVotes).map(v=>`<div>${v} → ${catVotes[v]}</div>`).join("")}

      <p><b>Manquants :</b></p>
      ${missing.map(m=>`<div style="color:red">${m}</div>`).join("")}
    </div>
  `;

  window.startCat=startCat;
  window.startAlbum=startAlbum;
  window.reset=reset;
}

async function startCat(){
  await setDoc(doc(db,"game","state"), {
    phase:"category"
  });

  await log("------- Catégorie lancée -------");
}

async function startAlbum(){

  const count = {};
  Object.values(catVotes).forEach(v=>{
    count[v]=(count[v]||0)+1;
  });

  const max = Math.max(...Object.values(count));
  let winners = Object.keys(count).filter(k=>count[k]===max);

  const chosen = winners[Math.floor(Math.random()*winners.length)];

  await setDoc(doc(db,"game","state"), {
    phase:"album",
    currentCategory: chosen
  });

  await log(`Catégorie validée : ${chosen}`);
}

async function reset(){

  if(!confirm("RESET SOIRÉE ?")) return;

  await setDoc(doc(db,"game","state"), {
    phase:"lobby",
    currentCategory:null
  });

  await setDoc(doc(db,"game","players"), {});
  await setDoc(doc(db,"game","categoryVotes"), {});

  await log("🔄 RESET COMPLET SOIRÉE");
}