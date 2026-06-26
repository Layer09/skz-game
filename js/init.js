import { db, doc, getDoc, setDoc } from "./firebase.js";

export async function initGame() {
  const gameRef = doc(db, "game", "state");
  const snap = await getDoc(gameRef);

  if (!snap.exists()) {
    await setDoc(gameRef, {
      phase: "lobby",
      round: 0,
      currentCategory: null,
      currentAlbum: null,
      createdAt: Date.now()
    });
  }

  const docs = [
    "players",
    "categoryVotes",
    "albumVotes",
    "photoVotes",
    "scores"
  ];

  for (const d of docs) {
    const ref = doc(db, "game", d);
    const s = await getDoc(ref);
    if (!s.exists()) {
      await setDoc(ref, {});
    }
  }
}