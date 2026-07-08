import {
  db,
  doc,
  onSnapshot,
  getDoc,
  setDoc,
  updateDoc
} from "./firebase.js";

import {
  initGame
} from "./init.js";


await initGame();



/* =========================
   STATE LIVE
========================= */


export function listenState(cb){

  return onSnapshot(
    doc(db,"game","state"),
    snap=>{

      cb(
        snap.data() || {}
      );

    }
  );

}



/* =========================
   PLAYERS
========================= */


export function listenPlayers(cb){

  return onSnapshot(
    doc(db,"game","players"),
    snap=>{

      cb(
        snap.data() || {}
      );

    }
  );

}



/* =========================
   VOTES
========================= */


export function listenVotes(cb){

  return onSnapshot(
    doc(db,"game","votes"),
    snap=>{

      cb(
        snap.data() || {
          category:{},
          album:{}
        }
      );

    }
  );

}



/* =========================
   GET VOTES
========================= */


export async function getVotes(){

  const snap =
    await getDoc(
      doc(db,"game","votes")
    );


  return snap.data() || {

    category:{},
    album:{}

  };

}



/* =========================
   UPDATE STATE
========================= */


export async function setState(data){

  await updateDoc(
    doc(db,"game","state"),
    data
  );

}



/* =========================
   ADD PLAYER
========================= */


export async function addPlayer(player){

  const ref =
    doc(db,"game","players");


  const snap =
    await getDoc(ref);


  const players =
    snap.data() || {};



  const exists =
    Object.values(players)
    .find(
      p=>p.name === player.name
    );



  if(exists){

    throw new Error(
      "NAME_TAKEN"
    );

  }



  players[player.id] =
    player;



  await setDoc(
    ref,
    players
  );

}



/* =========================
   SAVE CATEGORY VOTE
========================= */


export async function saveCategoryVote(
  player,
  value
){

  const votes =
    await getVotes();



  await setDoc(

    doc(db,"game","votes"),

    {

      category:{

        ...votes.category,

        [player]:value

      },


      album:

      votes.album || {}

    }

  );

}



/* =========================
   SAVE ALBUM VOTE
========================= */


export async function saveAlbumVote(
  player,
  value
){

  const votes =
    await getVotes();



  await setDoc(

    doc(db,"game","votes"),

    {

      category:

      votes.category || {},


      album:{

        ...votes.album,

        [player]:value

      }

    }

  );

}



/* =========================
   SAVE PHOTOCARD CHOICE
========================= */


export async function savePhotocardChoice(
  player,
  value
){

  const ref =
    doc(db,"game","photocardChoices");


  const snap =
    await getDoc(ref);


  const choices =
    snap.data() || {};



  await setDoc(

    ref,

    {

      ...choices,

      [player]:value

    }

  );

}



/* =========================
   RESET GAME
========================= */


export async function resetGame(){


  await setDoc(

    doc(db,"game","state"),

    {

      phase:"lobby",

      round:0,

      currentCategory:null,

      currentAlbum:null,

      locked:false,

      openedAlbums:[]

    }

  );



  await setDoc(

    doc(db,"game","players"),

    {}

  );



  await setDoc(

    doc(db,"game","votes"),

    {

      category:{},

      album:{}

    }

  );



  await setDoc(

    doc(db,"game","scores"),

    {}

  );



  await setDoc(

    doc(db,"game","photocardChoices"),

    {}

  );



  await setDoc(

    doc(db,"game","voteResult"),

    {}

  );



  await setDoc(

    doc(db,"game","logs"),

    {}

  );


}