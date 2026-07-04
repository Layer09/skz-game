import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCogakYcOa8mQkOE_MDR81_8UxxRBFbR5M",
  authDomain: "skz-album-game-69efe.firebaseapp.com",
  projectId: "skz-album-game-69efe",
  storageBucket: "skz-album-game-69efe.firebasestorage.app",
  messagingSenderId: "347203878239",
  appId: "1:347203878239:web:768fba1b2e0802efd64aea",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export {
  db,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  collection,
  addDoc,
  serverTimestamp
};