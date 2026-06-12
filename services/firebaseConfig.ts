import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// Extracted from google-services.json
const firebaseConfig = {
    apiKey: "AIzaSyBRl-cn5cr_CXzjE36LZh--ZbLvlABtLx8",
    authDomain: "ndao-hamaky-tantara-cc5a2.firebaseapp.com",
    projectId: "ndao-hamaky-tantara-cc5a2",
    storageBucket: "ndao-hamaky-tantara-cc5a2.firebasestorage.app",
    messagingSenderId: "906084791936",
    appId: "1:906084791936:web:117865f3484d9abdc8ffb7" // Note: This might need adjustment as the google-services.json is for Android
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
