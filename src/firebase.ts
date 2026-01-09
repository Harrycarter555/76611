import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSy....",
  authDomain: "reelearn-505d9.firebaseapp.com",
  projectId: "reelearn-505d9",
  storageBucket: "reelearn-505d9.appspot.com",
  messagingSenderId: "207249486424",
  appId: "1:207249486424:web:63461de258102164f8102d"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
