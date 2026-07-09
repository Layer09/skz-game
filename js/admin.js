import {
  db,
  doc,
  setDoc,
  onSnapshot
} from "./firebase.js";

import {
  listenState,
  listenPlayers,
  resetGame
} from "./game.js";

import {
  countVotes,
  getTopVotes,
  pickRandom
} from "./utils.js";

import {
  log
} from "./logs.js";

import {
  addPoints,
  getScores
} from "./scoring.js";

import {
  listenPhotocards,
  updatePhotocards,
  calculatePhotocardPoints,
  preparePhotocards
} from "./photocards.js";


const admin = document.getElementById("admin");


let state = null;
let players = {};
let votes = {};
let voteResult = null;
let photocardChoices = {};
let photocards = {};



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


onSnapshot(
  doc(db,"game","votes"),
  snap => {

    votes = snap.data() || {};
    render();

  }
);


onSnapshot(
  doc(db,"game","voteResult"),
  snap => {

    voteResult = snap.data() || null;
    render();

  }
);

onSnapshot(
  doc(db,"game","photocardChoices"),
  snap=>{

    photocardChoices =
      snap.data() || {};

    render();

  }
);

listenPhotocards((data)=>{

  photocards = data || {};
  render();

});




/* =========================
   RENDER
========================= */


function render(){

  if(!state) return;


  const categoryVotes = votes.category || {};
  const albumVotes = votes.album || {};



  admin.innerHTML = `
  <div class="admin-page">

  <div class="card">

    <h1>👑 ADMIN PANEL</h1>


    <button onclick="startCategory()">
      ▶ Start Category Vote
    </button>


    <button onclick="resolveCategory()">
      ⚡ Resolve Category
    </button>



    <button onclick="startAlbum()">
      ▶ Start Album Vote
    </button>


    <button onclick="resolveAlbum()">
      ⚡ Resolve Album
    </button>



    <button onclick="openPhotocards()">
      📸 Open Photocards
    </button>



    <button onclick="validatePhotocards()">
      ✅ Validate Photocards
    </button>



    <button onclick="finishGame()">
      🏁 Finish Game
    </button>


    <button onclick="showRanking()">
      📊 Show Ranking
    </button>


    <button onclick="reset()">
      🔄 Reset Game
    </button>


  </div>



  <div class="card">

    <h2>📊 State</h2>

    <p>
      Phase :
      <b>${state.phase}</b>
    </p>

    <p>
      Category :
      ${state.currentCategory || "-"}
    </p>


    <p>
      Album :
      ${state.currentAlbum || "-"}
    </p>


  </div>




  <div class="card">

    <h2>🗳️ Category votes</h2>


    ${
      Object.entries(categoryVotes)
      .map(([k,v])=>`

        <div>
          ${k} → ${v}
        </div>

      `)
      .join("")
    }


  </div>





  <div class="card">

    <h2>📀 Album votes</h2>


    ${
      Object.entries(albumVotes)
      .map(([k,v])=>`

        <div>
          ${k} → ${v}
        </div>

      `)
      .join("")
    }


  </div>




  ${
    state.phase === "photocards"
      ?
`
${renderPhotocardTable()}
`
      :
""
  }



  ${
    voteResult
    ?
`
<div class="card">

<h2>🏆 Last Result</h2>

<p>
Type :
${voteResult.type}
</p>


<p>
Winner :
<b>${voteResult.winner}</b>
</p>


</div>
`
:
""
}

</div>
`;



window.startCategory = startCategory;
window.resolveCategory = resolveCategory;

window.startAlbum = startAlbum;
window.resolveAlbum = resolveAlbum;

window.openPhotocards = openPhotocards;
window.validatePhotocards = validatePhotocards;

window.finishGame = finishGame;
window.showRanking = showRanking;
window.reset = reset;


}


/* =========================
   START CATEGORY
========================= */

async function startCategory(){

  await setDoc(
    doc(db,"game","votes"),
    {
      category:{},
      album:{}
    }
  );


  await setDoc(
    doc(db,"game","state"),
    {
      ...state,
      phase:"category",
      currentCategory:null
    }
  );


  await log(
    "🗳️ Category vote started"
  );

}



/* =========================
   RESOLVE CATEGORY
========================= */

async function resolveCategory(){

  const categoryVotes =
    votes.category || {};


  const counts =
    countVotes(categoryVotes);


  if(!Object.keys(counts).length){

    alert(
      "No category votes"
    );

    return;

  }


  const top =
    getTopVotes(counts);


  const winner =
    pickRandom(top);



  await setDoc(
    doc(db,"game","state"),
    {
      ...state,
      currentCategory:winner,
      phase:"categoryResult"
    }
  );



  await setDoc(
    doc(db,"game","voteResult"),
    {
      type:"category",
      votes:counts,
      winner
    }
  );


  await log(
    `⚡ Category resolved: ${winner}`
  );

}



/* =========================
   START ALBUM
========================= */

async function startAlbum(){


  if(!state.currentCategory){

    alert(
      "Resolve category first"
    );

    return;

  }



  await setDoc(
    doc(db,"game","votes"),
    {
      ...votes,
      album:{}
    }
  );



  await setDoc(
    doc(db,"game","state"),
    {
      ...state,
      phase:"album"
    }
  );



  await log(
    "📀 Album vote started"
  );


}



/* =========================
   RESOLVE ALBUM
========================= */

async function resolveAlbum(){


  const albumVotes =
    votes.album || {};



  const counts =
    countVotes(albumVotes);



  if(!Object.keys(counts).length){

    alert(
      "No album votes"
    );

    return;

  }



  const top =
    getTopVotes(counts);



  const winner =
    pickRandom(top);



  await setDoc(
    doc(db,"game","state"),
    {
      ...state,
      currentAlbum:winner,
      phase:"albumResult"
    }
  );



  await setDoc(
    doc(db,"game","voteResult"),
    {
      type:"album",
      votes:counts,
      winner
    }
  );



  /*
    Points pour les joueurs
    ayant trouvé l'album
  */

  const points = {};


  Object.keys(players)
  .forEach(player=>{

    if(albumVotes[player] === winner){

      points[player]=1;

    }

  });



  await addPoints(points);



  await log(
    `📀 Album resolved: ${winner}`
  );


}
 
/* =========================
   PHOTO CARD TABLE
========================= */


function renderPhotocardTable(){

  if(!Object.keys(photocards).length){

    return `
      <div class="card">
        <p>Aucune donnée photocards</p>
      </div>
    `;

  }



  return `

  <div class="card">

    <h2>📸 Photocards</h2>


    <table border="1" style="width:100%;text-align:center">

      <tr>

        <th>Membre</th>
        <th>Solo<br>+5</th>
        <th>Duo/Trio<br>+3</th>
        <th>Série<br>+1</th>
        <th>Bonus<br>+3</th>

      </tr>



      ${
        Object.entries(photocards)
        .map(([member,data])=>`

        <tr>

          <td>
            ${member}
          </td>


          <td>
            <input
              type="number"
              min="0"
              value="${data.solo || 0}"
              onchange="
                updatePhotoValue('${member}','solo',this.value)
              "
            >
          </td>


          <td>
            <input
              type="number"
              min="0"
              value="${data.duo || 0}"
              onchange="
                updatePhotoValue('${member}','duo',this.value)
              "
            >
          </td>


          <td>
            <input
              type="number"
              min="0"
              value="${data.serie || 0}"
              onchange="
                updatePhotoValue('${member}','serie',this.value)
              "
            >
          </td>


          <td>
            <input
              type="number"
              min="0"
              value="${data.bonus || 0}"
              onchange="
                updatePhotoValue('${member}','bonus',this.value)
              "
            >
          </td>


        </tr>


        `)
        .join("")
      }



    </table>


  </div>

  `;


}



window.updatePhotoValue = async function(
  member,
  category,
  value
){

  const data = {
    ...photocards
  };


  if(!data[member]){

    data[member] = {
      solo:0,
      duo:0,
      serie:0,
      bonus:0
    };

  }


  data[member][category] =
    Number(value);



  photocards = data;


  await updatePhotocards(data);

};






/* =========================
   OPEN PHOTO CARDS
========================= */


async function openPhotocards(){


  if(!state.currentAlbum){

    alert(
      "Aucun album sélectionné"
    );

    return;

  }



  const hasWoojin =
    state.currentAlbum.includes("mixtape")
    ||
    state.currentAlbum.includes("i_am_not")
    ||
    state.currentAlbum.includes("i_am_who")
    ||
    state.currentAlbum.includes("i_am_you");



  await preparePhotocards(hasWoojin);



  await setDoc(
    doc(db,"game","state"),
    {
      ...state,
      phase:"photocards"
    }
  );



  await log(
    "📸 Photocards opened"
  );


}






/* =========================
   VALIDATE PHOTO CARDS
========================= */


async function validatePhotocards(){

  const memberPoints = {};

  Object.entries(photocards).forEach(([member, values])=>{

    memberPoints[member] =
      (values.solo || 0) * 5 +
      (values.duo || 0) * 3 +
      (values.serie || 0) * 1 +
      (values.bonus || 0) * 3;

  });


  const playerPoints = {};

  Object.entries(photocardChoices).forEach(([player, member])=>{

    const pts =
      memberPoints[member] || 0;

    if(pts > 0){

      playerPoints[player] = pts;

    }

  });


  await addPoints(playerPoints);


  const winners =
    Object.keys(playerPoints);


  let message;

  if(winners.length === 0){

    message =
      "Personne n'a gagné de points sur cette manche !";

  }

  else if(winners.length === 1){

    message =
      `${winners[0]} a gagné des points sur cette manche !`;

  }

  else{

    message =
      `${winners.slice(0,-1).join(", ")} et ${winners.at(-1)} ont gagné des points sur cette manche !`;

  }


  await setDoc(
    doc(db,"game","voteResult"),
    {
      type:"photocards",
      winners
    }
  );


  await log(
    "📸 Photocards validated"
  );


  await setDoc(
    doc(db,"game","state"),
    {
      ...state,
      phase:"album"
    }
  );


  alert(message);

}







/* =========================
   FINISH GAME
========================= */


async function finishGame(){

  await setDoc(
    doc(db,"game","state"),
    {
      ...state,
      phase:"finished"
    }
  );


  await log(
    "🏁 GAME FINISHED"
  );

}





/* =========================
   RANKING
========================= */


async function showRanking(){

  const scores =
    await getScores();



  const ranking =
    Object.entries(scores)
    .sort(
      (a,b)=>b[1]-a[1]
    );



  let text =
    "🏆 RANKING\n\n";



  ranking.forEach(
    ([name,score],index)=>{

      text +=
      `${index+1}. ${name} - ${score}\n`;

    }
  );



  alert(text);


}







/* =========================
   RESET
========================= */


async function reset(){

  if(!confirm("Reset game ?"))
    return;


  await resetGame();


  await log(
    "🔄 RESET GAME"
  );

}