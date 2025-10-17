// js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyASfA0zZlPjFaiuMFMBPrPuZIxGTGu7IeM",
  authDomain: "urbanthreadsstore-700e6.firebaseapp.com",
  projectId: "urbanthreadsstore-700e6",
  storageBucket: "urbanthreadsstore-700e6.firebasestorage.app",
  messagingSenderId: "849846008677",
  appId: "1:849846008677:web:686c0bbb4e4e460434bf8c",
  measurementId: "G-6F5VJEY69G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
