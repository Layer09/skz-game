import { db, doc, getDoc, setDoc } from "./firebase.js";
import { initPhotocards } from "./photocards.js";


/* =========================
   INITIALISATION DU JEU
========================= */

export async function initGame() {

  const stateRef = doc(db, "game", "state");
  const snap = await getDoc(stateRef);


  if (!snap.exists()) {

    await setDoc(stateRef, {
      phase: "lobby",
      round: 0,
      currentCategory: null,
      currentAlbum: null,
      currentPlayer: null,
      locked: false,
      openedAlbums: [],
      createdAt: Date.now()
    });

  }


  const docs = [
    "players",
    "votes",
    "scores",
    "logs",
    "voteResult"
  ];


  for (const d of docs) {

    const ref = doc(db, "game", d);
    const s = await getDoc(ref);

    if (!s.exists()) {
      await setDoc(ref, {});
    }

  }


  // Initialisation photocards sécurisée
  await initPhotocards();

}