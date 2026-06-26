import { db, doc, getDoc, setDoc } from "./firebase.js";

/**
 * structure attendue :
 * {
 *   Seungmin: 3,
 *   Hyunjin: 2
 * }
 */

export async function addPoints(pointsMap) {
  const ref = doc(db, "game", "scores");
  const snap = await getDoc(ref);

  let scores = snap.exists() ? snap.data() : {};

  for (const [player, points] of Object.entries(pointsMap)) {
    scores[player] = (scores[player] || 0) + points;
  }

  await setDoc(ref, scores);
}

export async function getScores() {
  const ref = doc(db, "game", "scores");
  const snap = await getDoc(ref);

  return snap.exists() ? snap.data() : {};
}