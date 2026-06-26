import { db, doc, getDoc, setDoc } from "./firebase.js";

export async function initGame() {
  const base = doc(db, "game", "state");
  const s = await getDoc(base);

  if (!s.exists()) {
    await setDoc(base, {
      phase: "lobby",
      currentCategory: null,
      currentAlbum: null,
      round: 0
    });
  }

  const docs = ["players","categoryVotes","albumVotes","photoVotes"];

  for (let d of docs) {
    const ref = doc(db, "game", d);
    const snap = await getDoc(ref);
    if (!snap.exists()) await setDoc(ref, {});
  }
}