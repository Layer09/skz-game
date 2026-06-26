export function pickWithRoulette(options) {
  if (options.length === 1) return options[0];

  // version simple (UI animation sera ajoutée plus tard)
  const spins = 10;

  let current = options[0];

  for (let i = 0; i < spins; i++) {
    current = options[Math.floor(Math.random() * options.length)];
  }

  return current;
}