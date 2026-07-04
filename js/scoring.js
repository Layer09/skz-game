import { db, doc, getDoc, setDoc } from "./firebase.js";

/**
 * points rules simples :
 * - bon vote catégorie : +1
 * - bon album : +2
 */

export async function addRoundScores(results) {
  const ref = doc(db, "game", "scores");
  const snap = await getDoc(ref);

  let scores = snap.exists() ? snap.data() : {};

  for (const [player, data] of Object.entries(results)) {
    if (!scores[player]) scores[player] = 0;

    if (data.categoryCorrect) scores[player] += 1;
    if (data.albumCorrect) scores[player] += 2;
  }

  await setDoc(ref, scores);
}

export async function getScores() {
  const snap = await getDoc(doc(db, "game", "scores"));
  return snap.exists() ? snap.data() : {};
}