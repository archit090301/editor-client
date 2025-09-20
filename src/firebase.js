// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// Optional: import analytics if needed
// import { getAnalytics } from "firebase/analytics";

// Your Firebase config object
const firebaseConfig = {
  apiKey: "AIzaSyCWAamMispb0wnrTDB9YeJRdjX9Of94bJ8",
  authDomain: "editor-f012d.firebaseapp.com",
  projectId: "editor-f012d",
  storageBucket: "editor-f012d.firebasestorage.app",
  messagingSenderId: "17397996231",
  appId: "1:17397996231:web:2aefbaeae814ad1868bce2",
  measurementId: "G-1H09CPBJCV"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Optional: initialize Analytics
// const analytics = getAnalytics(app);
