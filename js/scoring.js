import { db, doc, getDoc, setDoc } from "./firebase.js";

/**
 * Ajoute des points aux joueurs
 * format:
 * {
 *   alice: 2,
 *   bob: 1
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

/**
 * Récupère classement
 */
export async function getScores() {
  const ref = doc(db, "game", "scores");
  const snap = await getDoc(ref);

  return snap.exists() ? snap.data() : {};
}

/**
 * Classement trié
 */
export async function getRanking() {
  const scores = await getScores();

  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1]);
}