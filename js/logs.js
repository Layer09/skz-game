import { db, collection, addDoc, serverTimestamp } from "./firebase.js";

export async function log(message, type = "info") {
  const text = `[${new Date().toLocaleTimeString()}] ${message}`;

  await addDoc(collection(db, "logs"), {
    text,
    type,
    createdAt: serverTimestamp()
  });

  console.log(text);
}