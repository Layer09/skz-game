export function countVotes(votes = {}) {
  const result = {};

  for (const v of Object.values(votes)) {
    if (!v) continue;
    result[v] = (result[v] || 0) + 1;
  }

  return result;
}

export function getTopVotes(count) {
  const values = Object.values(count);

  if (values.length === 0) return [];

  const max = Math.max(...values);

  return Object.keys(count).filter(k => count[k] === max);
}

export function pickRandom(arr = []) {
  if (!arr.length) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}