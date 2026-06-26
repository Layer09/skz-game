import { db, collection, addDoc, serverTimestamp } from "./firebase.js";

export async function log(msg) {
  const now = new Date();

  const text =
    `[${now.toLocaleDateString("fr-FR")} ${now.toLocaleTimeString("fr-FR")}] ${msg}`;

  await addDoc(collection(db, "logs"), {
    text,
    timestamp: serverTimestamp()
  });

  console.log(text);
}