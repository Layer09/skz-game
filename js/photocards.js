import { db, doc, getDoc, setDoc, onSnapshot } from "./firebase.js";

/* =========================
   LISTENER
========================= */

export function listenPhotocards(cb) {
  return onSnapshot(doc(db, "game", "photocards"), snap => {
    cb(snap.data() || {});
  });
}

/* =========================
   INITIALISATION SAFE
========================= */

export async function initPhotocards() {
  const ref = doc(db, "game", "photocards");
  const snap = await getDoc(ref);

  if (snap.exists()) return;

  await setDoc(ref, {
    "Seungmin": { solo: 0, duo: 0, set: 0, bonus: 0 },
    "Hyunjin": { solo: 0, duo: 0, set: 0, bonus: 0 },
    "Changbin": { solo: 0, duo: 0, set: 0, bonus: 0 },
    "Felix": { solo: 0, duo: 0, set: 0, bonus: 0 },
    "Han": { solo: 0, duo: 0, set: 0, bonus: 0 },
    "Lee Know": { solo: 0, duo: 0, set: 0, bonus: 0 },
    "Bang Chan": { solo: 0, duo: 0, set: 0, bonus: 0 },
    "I.N": { solo: 0, duo: 0, set: 0, bonus: 0 }
  });
}

/* =========================
   UPDATE GRILLE
========================= */

export async function updatePhotocards(data) {
  await setDoc(doc(db, "game", "photocards"), data);
}

/* =========================
   RESET
========================= */

export async function resetPhotocards() {
  await setDoc(doc(db, "game", "photocards"), {});
}