// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBP0VpYqNzlwH1o057foAqnBA1MmrekcLE",
  authDomain: "hirelens-8ca57.firebaseapp.com",
  projectId: "hirelens-8ca57",
  storageBucket: "hirelens-8ca57.firebasestorage.app",
  messagingSenderId: "215526974737",
  appId: "1:215526974737:web:ac5180a8eb4de13376d8b0",
  measurementId: "G-GJ094F7B9Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Safely initialize analytics in browser environment
let analytics = null;
if (typeof window !== 'undefined') {
  isSupported().then(supported => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {});
}

export { app, auth, googleProvider, analytics, firebaseConfig };
