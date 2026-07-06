let ALBUMS_CACHE = [];

export async function loadAlbums() {
  if (ALBUMS_CACHE.length) return ALBUMS_CACHE;

  const res = await fetch("./data/albums.json");
  const data = await res.json();

  ALBUMS_CACHE = data;
  return data;
}

export async function getAlbumsByEra(era) {
  const albums = await loadAlbums();
  return albums.filter(a => a.era === era);
}

export async function getAvailableAlbums(state) {
  const albums = await loadAlbums();

  const opened = state.openedAlbums || [];

  return albums.filter(a =>
    a.era === state.currentCategory &&
    !opened.includes(a.id)
  );
}