import { db, doc, getDoc, setDoc } from "./firebase.js";

export async function initGame() {
  const stateRef = doc(db, "game", "state");
  const snap = await getDoc(stateRef);

  if (!snap.exists()) {
    await setDoc(stateRef, {
      phase: "lobby",
      round: 0,
      currentCategory: null,
      currentAlbum: null,
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
}

await setDoc(doc(db, "game", "photocards"), {
  "Seungmin": { solo: 0, duo: 0, set: 0, bonus: 0 },
  "Hyunjin": { solo: 0, duo: 0, set: 0, bonus: 0 },
  "Changbin": { solo: 0, duo: 0, set: 0, bonus: 0 },
  "Felix": { solo: 0, duo: 0, set: 0, bonus: 0 },
  "Han": { solo: 0, duo: 0, set: 0, bonus: 0 },
  "Lee Know": { solo: 0, duo: 0, set: 0, bonus: 0 },
  "Bang Chan": { solo: 0, duo: 0, set: 0, bonus: 0 },
  "I.N": { solo: 0, duo: 0, set: 0, bonus: 0 }
});