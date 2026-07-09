import {
  db,
  doc,
  setDoc,
  onSnapshot
} from "./firebase.js";

import {
  addPlayer,
  listenState,
  listenPlayers,
  saveCategoryVote,
  saveAlbumVote,
  savePhotocardChoice
} from "./game.js";

import {
  loadAlbums
} from "./albums.js";

import {
  loadPlayers,
  getPlayerSecondaryColor
} from "./players.js";


const app = document.getElementById("app");


let state = null;
let players = {};

let me =
  localStorage.getItem("player_name");


let votes = {
  category:{},
  album:{}
};


let photocardChoices = {};

let albumsCache = [];

let playersConfig = {};

let scores = {};



/* =========================
   LISTEN STATE
========================= */


listenState((s)=>{

  state = s;

  render();

});





/* =========================
   LISTEN PLAYERS
========================= */


listenPlayers((p)=>{

  players = p || {};

  render();

});





/* =========================
   LISTEN VOTES
========================= */


onSnapshot(
  doc(db,"game","votes"),
  snap=>{

    votes =
      snap.data() ||
      {
        category:{},
        album:{}
      };

    render();

  }
);





/* =========================
   LISTEN PHOTO CHOICES
========================= */


let voteResult = null;


onSnapshot(
  doc(db,"game","voteResult"),
  snap=>{

    voteResult =
      snap.data() || null;

    render();

  }
);



onSnapshot(
  doc(db,"game","scores"),
  snap=>{

    scores =
      snap.data() || {};

    render();

  }
);




/* =========================
   ROOT
========================= */


function render(){

  if (!Object.keys(playersConfig).length) {
    loadPlayers().then(data => {
        playersConfig = data;
        render();
    });
  }

  if(!me){

    renderLogin();

    return;

  }



  if(!state){

    app.innerHTML =
    `
    <div class="card">
      Chargement...
    </div>
    `;

    return;

  }



  switch(state.phase){


    case "lobby":

      renderLobby();

      break;



    case "category":

      renderCategory();

      break;



    case "album":

      renderAlbum();

      break;



    case "photocards":

      renderPhotocards();

      break;

    case "categoryResult":

      renderCategoryResult();

      break;


    case "albumResult":

      renderAlbumResult();

      break;


    case "finished":

      renderRanking();

      break;

    default:


      app.innerHTML =
      `
      <div class="card">
        En attente...
      </div>
      `;


  }


}









/* =========================
   LOGIN
========================= */


function renderLogin(){


const availableNames =
[
"Alice",
"Bob",
"Charlie",
"Emma",
"Julie"
]
.filter(
name =>
!Object.values(players)
.some(
p=>p.name===name
)
);



app.innerHTML =

`

<div class="card">

<h2>Choisis ton prénom</h2>

</div>



<div class="card">

${
availableNames.map(name=>

`

<button onclick="selectPlayer('${name}')">

${name}

</button>

`

).join("")
}

</div>

`;



window.selectPlayer =
async(name)=>{


const config =
Object.values(playersConfig)
.find(
p=>p.name===name
);


await addPlayer({

id:name.toLowerCase(),

name,

color:
config.color

});


me=name;

localStorage.setItem(
"player_name",
name
);


render();


};


}









/* =========================
   LOBBY
========================= */


function renderLobby(){


app.innerHTML =

`

<div class="card">

<h2>⏳ En attente du host</h2>

<p>${me}</p>

</div>

`;



}









/* =========================
   CATEGORY
========================= */


function renderCategory(){


const already =
votes.category?.[me];



const color =
getPlayerSecondaryColor(
playersConfig,
me
);


app.innerHTML =


`

<div class="card">

<h2>📊 Catégorie</h2>

</div>



<div class="card">


<button

style="background:${votes.category?.[me] === 'old' ? color : '#808080'}"

onclick="voteCategory('old')"

>

Anciens (2018-2020)

</button>



<button

style="background:${votes.category?.[me] === 'recent' ? color : '#808080'}"

onclick="voteCategory('recent')"

>

Mid (2021-2023)

</button>



<button

style="background:${votes.category?.[me] === 'recent' ? color : '#808080'}"

onclick="voteCategory('recent')"

>

Récents (2024-2026)

</button>



</div>



<div class="card">

<h3>Votes</h3>

${
Object.entries(votes.category || {})
.map(([k,v])=>

`
<div>
${k} → ${v}
</div>
`

)
.join("")
}

</div>

`;





window.voteCategory =
async(value)=>{


if(state.locked)
return;



await saveCategoryVote(
  me,
  value
);



};



}


function renderCategoryResult(){

  if(!voteResult){

    app.innerHTML = `
      <div class="card">
        Résultat en attente...
      </div>
    `;

    return;

  }


  const votes =
    voteResult.votes || {};


  app.innerHTML = `

  <div class="card">

    <h2>🏆 Catégorie gagnante</h2>


    <h3>
      ${voteResult.winner}
    </h3>


    <div>

    <p>
      ${
        votes[voteResult.winner] || 0
      }
      vote${
        votes[voteResult.winner] > 1 ? "s" : ""
      }
    </p>

    </div>


  </div>

  `;

}








/* =========================
   ALBUM
========================= */


async function renderAlbum(){


if(!albumsCache.length)

albumsCache =
await loadAlbums();



const albums =
albumsCache.filter(a=>

a.era===state.currentCategory

&&

!(state.openedAlbums || [])
.includes(a.id)

);



const color =
getPlayerSecondaryColor(
playersConfig,
me
);



app.innerHTML =

`

<div class="card">

<h2>📀 Albums</h2>

</div>



${
albums.length===0

?

`

<div class="card">

⚠️ Aucun album disponible

</div>

`

:

albums.map(a=>

`

<div class="card">


<img src="${a.cover}">


<h3>${a.name}</h3>

<p>${a.year}</p>


<button

style="background:${votes.album?.[me] === a.id ? color : '#808080'}"

onclick="voteAlbum('${a.id}')"

>

Voter

</button>


</div>

`

).join("")

}


`;





window.voteAlbum =
async(id)=>{


if(state.locked)
return;



await setDoc(
doc(db,"game","votes"),
{

category:
votes.category,

album:
{

...votes.album,

[me]:id

}

},

{
merge:true
}

);



};



}

async function renderAlbumResult(){

  if(!voteResult){

    app.innerHTML = `
      <div class="card">
        Résultat en attente...
      </div>
    `;

    return;

  }


  if(!albumsCache.length)

    albumsCache = await loadAlbums();


  const album =
    albumsCache.find(
      a=>a.id===voteResult.winner
    );


  const count =
    voteResult.votes?.[voteResult.winner] || 0;



  app.innerHTML = `

  <div class="card">

    <h2>🏆 Album gagnant</h2>


    ${
      album
      ?
      `
      <img 
        src="${album.cover}"
        style="max-width:200px"
      >

      <h3>
        ${album.name}
      </h3>
      `
      :
      `
      <h3>
        ${voteResult.winner}
      </h3>
      `
    }


    <p>
      ${count} vote${count > 1 ? "s" : ""}
    </p>


  </div>

  `;

}






/* =========================
   PHOTO CARDS
========================= */


async function renderPhotocards(){


const albums =
await loadAlbums();



const album =
albums.find(
a=>a.id===state.currentAlbum
);



const hasWoojin =
album?.woojin;



const members =
hasWoojin

?

[
"Bang Chan",
"Lee Know",
"Changbin",
"Hyunjin",
"Han",
"Felix",
"Seungmin",
"I.N",
"Woojin"
]

:

[
"Bang Chan",
"Lee Know",
"Changbin",
"Hyunjin",
"Han",
"Felix",
"Seungmin",
"I.N"
];




const selected =
photocardChoices[me];



const color =
getPlayerSecondaryColor(
playersConfig,
me
);




app.innerHTML =


`

<div class="card">

<h2>📸 Choisis ta photocard</h2>

<p>
Album : ${album?.name || "-"}
</p>


</div>




<div class="card">

${
members.map(member=>

`

<button

style="background:${selected === member ? color : '#808080'}"

onclick="choosePhotocard('${member}')"

>

${member}

</button>

`

).join("")
}


</div>



${
selected

?

`

<div class="card">

Ton choix :
<b>${selected}</b>

</div>

`

:""

}


`;





window.choosePhotocard =
async(member)=>{


if(state.locked)
return;



await savePhotocardChoice(
  me,
  member
);


};


function renderRanking(){

  const ranking =
    Object.entries(scores)
    .sort(
      (a,b)=>b[1]-a[1]
    );


  app.innerHTML = `

  <div class="card">

    <h2>🏆 Score final</h2>


    ${
      ranking.length === 0

      ?

      `<p>Aucun score</p>`

      :

      ranking
      .map(([player,score],index)=>`

        <p>
          ${index+1}.
          ${player}
          -
          ${score} points
        </p>

      `)
      .join("")

    }


  </div>

  `;

}

}
