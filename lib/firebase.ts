import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyBVOgYna7XrE54Snt4wSL_A2najbCqzdRE",
    authDomain: "hardwood-hub-1d136.firebaseapp.com",
    projectId: "hardwood-hub-1d136",
    storageBucket: "hardwood-hub-1d136.firebasestorage.app",
    messagingSenderId: "573728604844",
    appId: "1:573728604844:web:e232fff4c69a219ff71509"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };
