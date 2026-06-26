import { db, collection, addDoc, serverTimestamp } from "./firebase.js";

export async function log(msg) {
  const time = new Date().toLocaleString("fr-FR");

  const text = `[${time}] ${msg}`;

  await addDoc(collection(db, "logs"), {
    text,
    createdAt: serverTimestamp()
  });

  console.log(text);
}