import {
  db,
  doc,
  getDoc,
  setDoc,
  onSnapshot
} from "./firebase.js";


/* =========================
   MEMBERS
========================= */

const MEMBERS = [
  "Bang Chan",
  "Lee Know",
  "Changbin",
  "Hyunjin",
  "Han",
  "Felix",
  "Seungmin",
  "I.N"
];


const MEMBERS_WOOJIN = [
  "Woojin",
  ...MEMBERS
];



/* =========================
   DEFAULT DATA
========================= */

function createEmptyPhotocards(includeWoojin = false) {

  const list = includeWoojin
    ? MEMBERS_WOOJIN
    : MEMBERS;


  const result = {};


  list.forEach(member => {

    result[member] = {
      solo: 0,
      duo: 0,
      serie: 0,
      bonus: 0
    };

  });


  return result;

}



/* =========================
   LISTENER
========================= */

export function listenPhotocards(callback) {

  return onSnapshot(
    doc(db, "game", "photocards"),
    snap => {

      callback(
        snap.data() || {}
      );

    }
  );

}



/* =========================
   INITIALISATION
========================= */

export async function initPhotocards() {

  const ref = doc(db, "game", "photocards");

  const snap = await getDoc(ref);


  if (snap.exists()) {
    return;
  }


  await setDoc(
    ref,
    createEmptyPhotocards(false)
  );

}



/* =========================
   RESET / PREPARATION ALBUM
========================= */

export async function preparePhotocards(hasWoojin = false) {

  await setDoc(
    doc(db, "game", "photocards"),
    createEmptyPhotocards(hasWoojin)
  );

}



/* =========================
   UPDATE TABLE
========================= */

export async function updatePhotocards(data) {

  await setDoc(
    doc(db, "game", "photocards"),
    data
  );

}



/* =========================
   CALCUL DES POINTS
========================= */

export function calculatePhotocardPoints(data) {

  const points = {};


  Object.entries(data).forEach(([member, values]) => {

    const score =
      (values.solo || 0) * 5 +
      (values.duo || 0) * 3 +
      (values.serie || 0) * 1 +
      (values.bonus || 0) * 3;


    if (score > 0) {

      points[member] = score;

    }

  });


  return points;

}



/* =========================
   RESET
========================= */

export async function resetPhotocards() {

  await setDoc(
    doc(db, "game", "photocards"),
    {}
  );

}