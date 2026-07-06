export function countVotes(votes = {}) {
  const result = {};

  for (const v of Object.values(votes)) {
    if (!v) continue;
    result[v] = (result[v] || 0) + 1;
  }

  return result;
}

export function getTopVotes(counts) {
  const max = Math.max(...Object.values(counts), 0);
  return Object.keys(counts).filter(k => counts[k] === max);
}

export function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Format debug lisible
 */
export function formatVotes(counts) {
  return Object.entries(counts)
    .map(([k, v]) => `${k}: ${v}`)
    .join(" | ");
}