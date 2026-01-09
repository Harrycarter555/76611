// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSy....",
  authDomain: "reelearn-505d9.firebaseapp.com",
  projectId: "reelearn-505d9",
  storageBucket: "reelearn-505d9.appspot.com",
  messagingSenderId: "207249486424",
  appId: "1:207249486424:web:63461de258102164f8102d",
  measurementId: "G-KW2KQF47GQ"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
