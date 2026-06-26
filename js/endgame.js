import { db, doc, getDoc } from "./firebase.js";

export async function getFinalRanking() {
  const snap = await getDoc(doc(db, "game", "scores"));

  const scores = snap.exists() ? snap.data() : {};

  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1]);
}

export async function resetScores() {
  await setDoc(doc(db, "game", "scores"), {});
}