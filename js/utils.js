export function countVotes(votes = {}) {
  const result = {};

  for (const v of Object.values(votes)) {
    result[v] = (result[v] || 0) + 1;
  }

  return result;
}

export function getTopVotes(counts) {
  const max = Math.max(...Object.values(counts));
  return Object.keys(counts).filter(k => counts[k] === max);
}

export function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* safe merge vote (important V4 fix) */
export function setVote(votes, player, value) {
  return {
    ...votes,
    [player]: value
  };
}