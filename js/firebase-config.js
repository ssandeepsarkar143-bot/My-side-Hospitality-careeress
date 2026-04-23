import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyCuAuc9qhA7D_-Lqt-69pbG81KTIiDFVpg",
  authDomain: "hospitality-careers-e662f.firebaseapp.com",
  projectId: "hospitality-careers-e662f",
  storageBucket: "hospitality-careers-e662f.firebasestorage.app",
  messagingSenderId: "45029895717",
  appId: "1:45029895717:web:f54f86f608b98751cad9cc"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
