export function countVotes(votes={}) {
  const r = {};
  Object.values(votes).forEach(v => {
    r[v] = (r[v] || 0) + 1;
  });
  return r;
}

export function pickWinner(count) {
  const max = Math.max(...Object.values(count));
  return Object.keys(count).filter(k => count[k] === max);
}