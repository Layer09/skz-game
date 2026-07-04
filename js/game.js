import { db, doc, getDoc, setDoc, updateDoc, onSnapshot } from "./firebase.js";
import { initGame } from "./init.js";

await initGame();

/* =========================
   STATE LIVE
========================= */

export function listenGame(callback) {
  return onSnapshot(doc(db, "game", "state"), snap => {
    callback(snap.data());
  });
}

/* =========================
   SET PHASE SAFE
========================= */

export async function setPhase(phase, data = {}) {
  const ref = doc(db, "game", "state");

  await updateDoc(ref, {
    phase,
    ...data
  });
}

/* =========================
   PLAYERS
========================= */

export async function addPlayer(name) {
  const ref = doc(db, "game", "players");
  const snap = await getDoc(ref);

  const players = snap.data() || {};

  if (Object.values(players).some(p => p?.name === name)) {
    throw new Error("Name already taken");
  }

  await setDoc(ref, {
    ...players,
    [name]: {
      name,
      joinedAt: Date.now()
    }
  });
}