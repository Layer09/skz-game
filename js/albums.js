let albumsCache = null;

export async function loadAlbums() {
  if (albumsCache) return albumsCache;

  const res = await fetch("./data/albums.json");
  const data = await res.json();

  albumsCache = data;
  return data;
}

export async function getAlbumsByEra(era, opened = []) {
  const albums = await loadAlbums();

  return albums.filter(a =>
    a.era === era && !opened.includes(a.id)
  );
}
