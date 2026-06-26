export function countVotes(votes = {}) {
  const result = {};

  for (const v of Object.values(votes)) {
    result[v] = (result[v] || 0) + 1;
  }

  return result;
}

export function getTopVotes(count) {
  const max = Math.max(...Object.values(count));
  return Object.keys(count).filter(k => count[k] === max);
}

export function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}