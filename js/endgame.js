import { getRanking } from "./scoring.js";

export async function showFinalRanking() {
  const ranking = await getRanking();

  let text = "🏆 FINAL RANKING\n\n";

  ranking.forEach(([name, score], i) => {
    text += `${i + 1}. ${name} - ${score}\n`;
  });

  alert(text);
}