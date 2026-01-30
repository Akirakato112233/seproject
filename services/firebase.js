// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithCredential } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBQe3eqsXSjLyd15PD_bsTGmYfaOlpyF8M",
    authDomain: "seproject-3e0bc.firebaseapp.com",
    projectId: "seproject-3e0bc",
    storageBucket: "seproject-3e0bc.firebasestorage.app",
    messagingSenderId: "543704041787",
    appId: "1:543704041787:web:687877d516fa2eb1578f1e",
    measurementId: "G-LSNNN2W2VJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Sign in with Google (for web)
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

// Sign in with Google credential (for mobile - use with expo-auth-session token)
export const signInWithGoogleCredential = (idToken, accessToken) => {
    const credential = GoogleAuthProvider.credential(idToken, accessToken);
    return signInWithCredential(auth, credential);
};

export default app;