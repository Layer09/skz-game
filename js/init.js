import { db, doc, getDoc, setDoc } from "./firebase.js";

export async function initGame() {
  const stateRef = doc(db, "game", "state");
  const stateSnap = await getDoc(stateRef);

  if (!stateSnap.exists()) {
    await setDoc(stateRef, {
      phase: "lobby",
      round: 0,
      currentCategory: null,
      currentAlbum: null,
      openedAlbums: [],
      locked: false,
      voteResult: null,
      createdAt: Date.now()
    });
  }

  const docs = ["players", "votes", "scores", "logs"];

  for (const d of docs) {
    const ref = doc(db, "game", d);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      await setDoc(ref, {});
    }
  }
}