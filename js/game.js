import { db, doc, getDoc, setDoc, updateDoc, onSnapshot } from "./firebase.js";
import { initGame } from "./init.js";

await initGame();

/**
 * État global live
 */
export function listenGame(callback) {
  return onSnapshot(doc(db, "game", "state"), snap => {
    callback(snap.data());
  });
}

/**
 * Reset propre
 */
export async function resetGame() {
  await setDoc(doc(db, "game", "state"), {
    phase: "lobby",
    round: 0,
    currentCategory: null,
    currentAlbum: null
  });

  const emptyDocs = [
    "players",
    "categoryVotes",
    "albumVotes",
    "photoVotes",
    "scores"
  ];

  for (const d of emptyDocs) {
    await setDoc(doc(db, "game", d), {});
  }
}

/**
 * Update phase
 */
export async function setPhase(phase, data = {}) {
  await updateDoc(doc(db, "game", "state"), {
    phase,
    ...data
  });
}

/**
 * Players system
 */
export async function addPlayer(name) {
  const ref = doc(db, "game", "players");
  const snap = await getDoc(ref);

  const players = snap.data() || {};

  if (Object.values(players).includes(name)) {
    throw new Error("Name already taken");
  }

  await updateDoc(ref, {
    [name]: {
      name,
      joinedAt: Date.now()
    }
  });
}