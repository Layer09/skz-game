import { db, doc, getDoc, setDoc } from "./firebase.js";

/* =========================
   LOAD ALBUMS JSON
========================= */

export async function loadAlbums() {
  const res = await fetch("./data/albums.json");
  const albums = await res.json();

  return albums;
}

/* =========================
   GET STATE ALBUMS
========================= */

export async function getAvailableAlbums() {
  const stateRef = doc(db, "game", "state");
  const snap = await getDoc(stateRef);

  const state = snap.data();
  return state.availableAlbums || [];
}

/* =========================
   INIT ALBUMS INTO STATE
   (1 seule fois au démarrage)
========================= */

export async function initAlbumsIfNeeded() {
  const stateRef = doc(db, "game", "state");
  const snap = await getDoc(stateRef);

  const state = snap.data();

  if (state.availableAlbums?.length) return;

  const albums = await loadAlbums();

  await setDoc(stateRef, {
    ...state,
    availableAlbums: albums
  });
}

/* =========================
   REMOVE OPENED ALBUM
========================= */

export async function removeAlbum(albumId) {
  const ref = doc(db, "game", "state");
  const snap = await getDoc(ref);

  const state = snap.data();

  const updated = state.availableAlbums.filter(a => a.id !== albumId);

  await setDoc(ref, {
    ...state,
    availableAlbums: updated
  });
}

/* =========================
   CATEGORY BUILDER
========================= */

export function buildCategories(albums = []) {
  const categories = {
    old: albums.filter(a => a.era === "old"),
    mid: albums.filter(a => a.era === "mid"),
    recent: albums.filter(a => a.era === "recent")
  };

  return categories;
}