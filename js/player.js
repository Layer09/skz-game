import {
  db,
  doc,
  setDoc,
  onSnapshot
} from "./firebase.js";

import {
  addPlayer,
  listenState,
  listenPlayers
} from "./game.js";

import {
  loadAlbums
} from "./albums.js";

import {
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


onSnapshot(
  doc(db,"game","photocardChoices"),
  snap=>{

    photocardChoices =
      snap.data() ||
      {};

    render();

  }
);








/* =========================
   ROOT
========================= */


function render(){


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


await addPlayer({

id:name.toLowerCase(),

name

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
players,
me
);



app.innerHTML =


`

<div class="card">

<h2>📊 Catégorie</h2>

</div>



<div class="card">


<button

style="background:${color}"

onclick="voteCategory('old')"

>

Anciens (2018-2020)

</button>



<button

style="background:${color}"

onclick="voteCategory('mid')"

>

Mid (2021-2023)

</button>



<button

style="background:${color}"

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



await setDoc(
doc(db,"game","votes"),
{

category:
{

...votes.category,

[me]:value

},

album:
votes.album

},

{
merge:true
}

);



};



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
players,
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

style="background:${color}"

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
players,
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

style="background:${color}"

onclick="choosePhotocard('${member}')"

${selected ? "disabled":""}

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



await setDoc(
doc(db,"game","photocardChoices"),
{

...photocardChoices,

[me]:member

},

{
merge:true
}

);


};



}