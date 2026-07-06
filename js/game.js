import { db, doc, onSnapshot, getDoc, setDoc, updateDoc } from "./firebase.js";
import { initGame } from "./init.js";

await initGame();

/* =========================
   STATE LIVE
========================= */

export function listenState(cb) {
  return onSnapshot(doc(db, "game", "state"), snap => {
    cb(snap.data());
  });
}

/* =========================
   PLAYERS
========================= */

export function listenPlayers(cb) {
  return onSnapshot(doc(db, "game", "players"), snap => {
    cb(snap.data() || {});
  });
}

/* =========================
   VOTES
========================= */

export function listenVotes(cb) {
  return onSnapshot(doc(db, "game", "votes"), snap => {
    cb(snap.data() || {});
  });
}

/* =========================
   UPDATE STATE
========================= */

export async function setState(data) {
  const ref = doc(db, "game", "state");
  await updateDoc(ref, data);
}

/* =========================
   ADD PLAYER
========================= */

export async function addPlayer(player) {
  const ref = doc(db, "game", "players");
  const snap = await getDoc(ref);

  const players = snap.data() || {};

  const exists = Object.values(players).find(p => p.name === player.name);
  if (exists) throw new Error("NAME_TAKEN");

  players[player.id] = player;

  await setDoc(ref, players);
}

/* =========================
   RESET GAME
========================= */

export async function resetGame() {
  await setDoc(doc(db, "game", "state"), {
    phase: "lobby",
    round: 0,
    currentCategory: null,
    currentAlbum: null,
    locked: false,
    openedAlbums: []
  });

  await setDoc(doc(db, "game", "players"), {});
  await setDoc(doc(db, "game", "votes"), {});
  await setDoc(doc(db, "game", "scores"), {});
  await setDoc(doc(db, "game", "voteResult"), {});
  await setDoc(doc(db, "game", "logs"), {});
}