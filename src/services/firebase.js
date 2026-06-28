import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with Google Provider
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore
// Pass the databaseId from your config if it's not the (default) database
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || "ai-studio-def583f3-f2cb-439d-97a5-fd18d37e5223");

// No longer exporting storage

export default app;
