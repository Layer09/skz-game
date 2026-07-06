let PLAYERS_CACHE = null;

export async function loadPlayers() {
  if (PLAYERS_CACHE) return PLAYERS_CACHE;

  const res = await fetch("./data/players.json");
  const data = await res.json();

  const map = {};

  for (const p of data.players) {
    map[p.id] = p;
  }

  PLAYERS_CACHE = map;
  return map;
}

export async function getPlayerByName(name) {
  const players = await loadPlayers();
  return Object.values(players).find(p => p.name === name);
}

export function getPlayerColor(playersMap, name) {
  const p = Object.values(playersMap).find(x => x.name === name);
  return p?.color?.secondary || "#333";
}

export function getPlayerPrimaryColor(playersMap, name) {
  const p = Object.values(playersMap).find(x => x.name === name);
  return p?.color?.primary || "#666";
}